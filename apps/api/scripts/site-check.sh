#!/usr/bin/env bash
#
# Read-only check of the server, for two questions:
#   1. Why do pages sometimes fail to load a file ("connection reset")?
#   2. What would come back by itself if the server restarted?
#
# Run on the server:   bash /var/www/mjnhealthcare/apps/api/scripts/site-check.sh
#
# It changes nothing. It downloads a few of the sites' own public files from this server to
# itself and reads system counters. It prints no keys, passwords, names, emails or phone numbers.

set -u
export LC_ALL=C
section() { printf '\n== %s ==\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ── The server itself ────────────────────────────────────────────────────────
section "Server"
echo "time now:     $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "running for:  $(uptime -p 2>/dev/null | sed 's/^up //') (started $(uptime -s 2>/dev/null))"
echo "load:         $(cut -d' ' -f1-3 /proc/loadavg) on $(nproc) processor(s)  (a load above the processor count means it is overstretched)"
free -m | awk '/^Mem:/ {printf "memory:       %d MB used of %d MB, %d MB available\n", $3, $2, $7} /^Swap:/ {printf "swap:         %d MB used of %d MB\n", $3, $2}'
df -h / | awk 'NR==2 {printf "disk:         %s used of %s (%s)\n", $3, $2, $5}'
echo "busiest now:  $(ps -eo pcpu,comm --sort=-pcpu | awk 'NR>1 && NR<=4 {printf "%s %s%%  ", $2, $1}')"

# ── Caddy: the program every visit passes through ────────────────────────────
section "Caddy (the front door)"
CPID=$(pgrep -x caddy | head -1)
if [ -z "$CPID" ]; then
  echo "NOT RUNNING"
else
  echo "running:      pid $CPID, started $(ps -o lstart= -p "$CPID"), by user $(ps -o user= -p "$CPID")"
  echo "version:      $(caddy version 2>/dev/null | cut -d' ' -f1)"
  echo "connections:  $(ls /proc/"$CPID"/fd 2>/dev/null | wc -l) files and connections open, limit $(awk '/Max open files/ {print $4}' /proc/"$CPID"/limits)"
  echo "memory:       $(awk '/VmRSS/ {printf "%d MB", $2/1024}' /proc/"$CPID"/status)"
  echo "listening:    TCP $(ss -ltnpH 2>/dev/null | grep "pid=$CPID," | awk '{print $4}' | tr '\n' ' ')"
  udp=$(ss -lunpH 2>/dev/null | grep "pid=$CPID," | awk '{print $4}' | tr '\n' ' ')
  echo "              UDP ${udp:-none}  (UDP 443 is the newer, more forgiving connection type, HTTP/3)"
fi

section "Firewall"
if have ufw; then
  ufw status 2>/dev/null | sed -n '1,25p' | sed -E 's/([0-9]+\.[0-9]+)\.[0-9]+\.[0-9]+/\1.x.x/g'
else
  echo "ufw is not installed"
fi

# ── The apps ─────────────────────────────────────────────────────────────────
section "Apps"
if have pm2; then
  pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try {
        for (const p of JSON.parse(s)) {
          const e = p.pm2_env || {};
          const mins = Math.round((Date.now() - e.pm_uptime) / 60000);
          const up = mins >= 1440 ? Math.round(mins / 1440) + " d" : mins >= 60 ? Math.round(mins / 60) + " h" : mins + " min";
          const mem = Math.round(((p.monit || {}).memory || 0) / 1048576);
          console.log(`${String(p.name).padEnd(13)} ${String(e.status).padEnd(8)} restarted ${String(e.restart_time).padStart(5)} times   up ${up.padEnd(7)} memory ${mem} MB`);
        }
      } catch (err) { console.log("could not read the PM2 list"); }
    });'
else
  echo "pm2 not found"
fi

# ── Loading test ─────────────────────────────────────────────────────────────
# Downloads a site's own script files many times, from this server to itself. The internet
# between a visitor and the server is not involved, so a failure here is a fault on the server.
section "Loading test (from this server to itself)"
load_test() {
  local name="$1" host="$2" port="$3" page="$4"
  local html chunks c i out rc code size secs ver exp burst
  local total=0 bad=0 direct_bad=0 slowest=0 proto="?"
  html=$(curl -sS --max-time 20 "https://$host$page" 2>/dev/null)
  chunks=$(printf '%s' "$html" | grep -oE '/_next/static/chunks/[A-Za-z0-9._~/-]+\.js' | sort -u | head -6)
  if [ -z "$chunks" ]; then
    printf '%-8s the page https://%s%s did not load from here, so its files could not be tested\n' "$name" "$host" "$page"
    return
  fi
  for c in $chunks; do
    exp=$(curl -s --max-time 30 -o /dev/null -w '%{size_download}' "http://localhost:$port$c")
    for i in 1 2 3 4 5 6 7 8 9 10; do
      total=$((total + 1))
      out=$(curl -s --http2 --max-time 30 -o /dev/null -w '%{http_code} %{size_download} %{time_total} %{http_version}' "https://$host$c"); rc=$?
      read -r code size secs ver <<< "$out"
      if [ "$rc" -ne 0 ] || [ "${code:-000}" != "200" ] || [ "${size:-0}" != "$exp" ]; then bad=$((bad + 1)); fi
      proto="${ver:-?}"
      slowest=$(awk -v a="$slowest" -v b="${secs:-0}" 'BEGIN { print (b + 0 > a + 0) ? b : a }')
      out=$(curl -s --max-time 30 -o /dev/null -w '%{http_code} %{size_download}' "http://localhost:$port$c"); rc=$?
      read -r code size <<< "$out"
      if [ "$rc" -ne 0 ] || [ "${code:-000}" != "200" ] || [ "${size:-0}" != "$exp" ]; then direct_bad=$((direct_bad + 1)); fi
    done
  done
  # A page asks for many files at the same moment; do the same.
  burst=$(for c in $chunks; do for i in 1 2 3 4 5; do echo "https://$host$c"; done; done \
    | xargs -P 12 -I{} curl -s --http2 --max-time 30 -o /dev/null -w '%{http_code}\n' {} | grep -vc '^200$')
  printf '%-8s through Caddy: %d downloads, %d failed (slowest %ss, HTTP/%s) | straight from the app: %d failed | many at once: %d failed\n' \
    "$name" "$total" "$bad" "$slowest" "$proto" "$direct_bad" "${burst:-?}"
}
load_test portal  portal.mjnhealthcare.com 3002 /login
load_test admin   admin.mjnhealthcare.com  3004 /login
load_test website mjnhealthcare.com        3001 /

# ── The network, as the server has seen it ───────────────────────────────────
section "Network (totals since the server started)"
if have nstat; then
  nstat -asz 2>/dev/null | awk '
    $1=="TcpOutSegs"{out=$2} $1=="TcpRetransSegs"{re=$2} $1=="TcpOutRsts"{rst=$2} $1=="TcpEstabResets"{er=$2} $1=="TcpAttemptFails"{af=$2}
    $1=="TcpExtTCPAbortOnTimeout"{at=$2} $1=="TcpExtTCPAbortOnData"{ad=$2} $1=="TcpExtTCPTimeouts"{to=$2}
    $1=="TcpExtListenOverflows"{lo=$2} $1=="TcpExtListenDrops"{ld=$2}
    END {
      printf "data sent:            %d pieces, %d had to be sent again (%.2f%%)\n", out, re, out ? re * 100 / out : 0
      printf "connections dropped:  %d reset, %d given up after no reply, %d timeouts\n", er, at, to
      printf "server side:          %d resets sent, %d closed with data unread, %d could not be accepted (queue full %d)\n", rst, ad, ld, lo
    }'
else
  echo "nstat is not installed"
fi
if [ -r /proc/sys/net/netfilter/nf_conntrack_count ]; then
  echo "connection table:     $(cat /proc/sys/net/netfilter/nf_conntrack_count) of $(cat /proc/sys/net/netfilter/nf_conntrack_max) in use"
fi
ip -o link show 2>/dev/null | awk '$2 !~ /^(lo|docker|veth|br-)/ { for (i = 1; i <= NF; i++) if ($i == "mtu") printf "network card:         %s largest packet %s\n", $2, $(i + 1) }' | head -2

section "Kernel messages worth knowing about"
msgs=$(dmesg -T 2>/dev/null | grep -iE 'out of memory|oom-kill|conntrack|table full|too many orphaned|SYN flooding|segfault|link is down' | tail -8)
echo "${msgs:-none}"

section "Recent errors from the portal app (most frequent first)"
plog=$(ls -t /root/.pm2/logs/mjn-portal-error*.log 2>/dev/null | head -1)
if [ -n "$plog" ] && [ -s "$plog" ]; then
  echo "last written $(date -r "$plog" '+%Y-%m-%d %H:%M'), $(wc -l < "$plog") lines in all; from the last 400:"
  tail -400 "$plog" | grep -vE '^\s*(at |Read more|\}|\{|$)' | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/<email>/g' | cut -c1-140 | sort | uniq -c | sort -rn | head -6
else
  echo "no errors logged"
fi

# ── What would come back after a restart ─────────────────────────────────────
section "After a server restart: what would come back by itself"
caddy_unit=$(systemctl list-unit-files 2>/dev/null | grep -i '^caddy' | tr -s ' ' | tr '\n' ';')
caddy_enabled=$(systemctl is-enabled caddy 2>/dev/null)
caddy_active=$(systemctl is-active caddy 2>/dev/null)
echo "Caddy program:        $(command -v caddy 2>/dev/null)   installed as a system package: $(dpkg -s caddy >/dev/null 2>&1 && echo yes || echo no)"
echo "Caddy service:        ${caddy_unit:-none installed}   enabled: ${caddy_enabled:-no}   active: ${caddy_active:-no}"
if [ -n "$CPID" ]; then
  echo "Caddy running now:    started by hand from $(readlink /proc/"$CPID"/cwd 2>/dev/null), home $(tr '\0' '\n' < /proc/"$CPID"/environ 2>/dev/null | grep '^HOME=' | cut -d= -f2)"
fi
for d in /root/.local/share/caddy /var/lib/caddy/.local/share/caddy; do
  if [ -d "$d/certificates" ]; then echo "certificates kept in: $d ($(find "$d/certificates" -name '*.crt' 2>/dev/null | wc -l) certificates)"; fi
done
pm2_unit=$(systemctl list-unit-files 2>/dev/null | grep -i '^pm2' | tr -s ' ' | tr '\n' ';')
echo "PM2 start-up service: ${pm2_unit:-none installed}"
if [ -f /root/.pm2/dump.pm2 ]; then
  echo "PM2 saved app list:   written $(date -r /root/.pm2/dump.pm2 '+%Y-%m-%d %H:%M'): $(node -e 'try { console.log(JSON.parse(require("fs").readFileSync("/root/.pm2/dump.pm2", "utf8")).map((p) => p.name).join(", ")) } catch (e) { console.log("unreadable") }')"
else
  echo "PM2 saved app list:   none (the apps would NOT come back)"
fi
boot=$( { crontab -l 2>/dev/null | grep -v '^#' | grep -iE '@reboot|caddy|pm2'; grep -iE 'caddy|pm2' /etc/rc.local 2>/dev/null; } | sed -E 's/(KEY|SECRET|TOKEN|PASSWORD)=[^ ]+/\1=<hidden>/g' | cut -c1-160)
echo "start-up commands:    ${boot:-none in crontab or rc.local}"
if have docker; then
  docker ps -a --format '{{.Names}}' 2>/dev/null | while read -r n; do
    echo "docker container:     $n, restart policy \"$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$n" 2>/dev/null)\", docker service enabled: $(systemctl is-enabled docker 2>/dev/null)"
  done
fi

printf '\nNothing was changed.\n'
