'use client';

/**
 * Solar icon shim — drop-in replacement for @phosphor-icons/react.
 *
 * Style rules:
 *   Bold        → functional UI: nav, buttons, forms, table actions (≤24px)
 *   Bold-Duotone → decorative: stat cards, empty states, feature pillars (≥32px)
 *
 * Usage:
 *   import { Bell, GraduationCap } from '@mjn/ui';
 *   <Bell className="h-5 w-5" />                        // Bold (default)
 *   <GraduationCap weight="duotone" className="h-10 w-10" />  // Bold-Duotone
 *
 * Powered by Solar icon set via @iconify/react.
 */

import * as React from 'react';
import { Icon as IIcon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';

// Register all Solar icons offline — no CDN fetch needed
addCollection(solarIcons as any);

interface IconProps {
  className?: string;
  /** Phosphor-compat size prop — sets width & height. If omitted, CSS controls sizing. */
  size?: number;
  width?: number;
  height?: number;
  /** 'duotone' → Solar Bold-Duotone; any other value → Solar Bold */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

function makeIcon(boldName: string, duotoneName?: string) {
  const SolarIcon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size, width, height, weight, className, ...rest }, _ref) => {
      const icon =
        weight === 'duotone' && duotoneName ? duotoneName : boldName;
      // Only pass explicit dimensions when caller provides them; otherwise let CSS/Tailwind control size
      const sizeProps =
        width != null || size != null
          ? { width: width ?? size, height: height ?? width ?? size }
          : {};
      return (
        <IIcon
          icon={icon}
          className={className}
          {...sizeProps}
          {...(rest as any)}
        />
      );
    },
  );
  SolarIcon.displayName = boldName;
  return SolarIcon;
}

// ── Navigation & Arrows ─────────────────────────────────────────────────────
export const ArrowLeft            = makeIcon('solar:alt-arrow-left-bold');
export const ArrowRight           = makeIcon('solar:alt-arrow-right-bold');
export const ArrowUp              = makeIcon('solar:alt-arrow-up-bold');
export const ArrowDown            = makeIcon('solar:alt-arrow-down-bold');
export const ArrowSquareUpRight   = makeIcon('solar:arrow-right-up-bold');
export const ArrowClockwise       = makeIcon('solar:refresh-bold');
export const ArrowCounterClockwise = makeIcon('solar:refresh-bold');
export const CaretDown            = makeIcon('solar:alt-arrow-down-bold');
export const CaretUp              = makeIcon('solar:alt-arrow-up-bold');
export const CaretLeft            = makeIcon('solar:alt-arrow-left-bold');
export const CaretRight           = makeIcon('solar:alt-arrow-right-bold');
export const HouseSimple          = makeIcon('solar:home-2-bold', 'solar:home-2-bold-duotone');
export const House                = makeIcon('solar:home-2-bold', 'solar:home-2-bold-duotone');

// ── People ───────────────────────────────────────────────────────────────────
export const User                 = makeIcon('solar:user-rounded-bold', 'solar:user-rounded-bold-duotone');
export const UserCircle           = makeIcon('solar:user-circle-bold', 'solar:user-circle-bold-duotone');
export const Users                = makeIcon('solar:users-group-rounded-bold', 'solar:users-group-rounded-bold-duotone');
export const UsersThree           = makeIcon('solar:users-group-two-rounded-bold', 'solar:users-group-two-rounded-bold-duotone');
export const UserPlus             = makeIcon('solar:user-plus-rounded-bold', 'solar:user-plus-rounded-bold-duotone');
export const IdentificationCard   = makeIcon('solar:card-2-bold', 'solar:card-2-bold-duotone');

// ── Communication ────────────────────────────────────────────────────────────
export const Envelope             = makeIcon('solar:letter-bold', 'solar:letter-bold-duotone');
export const EnvelopeSimple       = makeIcon('solar:letter-bold', 'solar:letter-bold-duotone');
export const Phone                = makeIcon('solar:phone-bold', 'solar:phone-bold-duotone');
export const ChatCircle           = makeIcon('solar:chat-round-bold', 'solar:chat-round-bold-duotone');
export const ChatText             = makeIcon('solar:chat-square-bold', 'solar:chat-square-bold-duotone');
export const ChatDots             = makeIcon('solar:chat-dots-bold', 'solar:chat-dots-bold-duotone');
export const PaperPlaneTilt       = makeIcon('solar:plain-2-bold', 'solar:plain-2-bold-duotone');
export const Send                 = makeIcon('solar:plain-2-bold', 'solar:plain-2-bold-duotone');
export const Bell                 = makeIcon('solar:bell-bold', 'solar:bell-bold-duotone');
export const BellRinging          = makeIcon('solar:bell-bing-bold', 'solar:bell-bing-bold-duotone');
export const WhatsappLogo         = makeIcon('solar:chat-round-bold', 'solar:chat-round-bold-duotone');

// ── Files & Documents ────────────────────────────────────────────────────────
export const FileText             = makeIcon('solar:document-text-bold', 'solar:document-text-bold-duotone');
export const File                 = makeIcon('solar:document-bold', 'solar:document-bold-duotone');
export const Files                = makeIcon('solar:folder-bold', 'solar:folder-bold-duotone');
export const FolderOpen           = makeIcon('solar:folder-open-bold', 'solar:folder-open-bold-duotone');
export const Article              = makeIcon('solar:document-text-bold', 'solar:document-text-bold-duotone');
export const Note                 = makeIcon('solar:notes-bold', 'solar:notes-bold-duotone');
export const Newspaper            = makeIcon('solar:notes-bold', 'solar:notes-bold-duotone');
export const Scroll               = makeIcon('solar:document-bold', 'solar:document-bold-duotone');
export const Receipt              = makeIcon('solar:receipt-bold', 'solar:receipt-bold-duotone');
export const Clipboard            = makeIcon('solar:clipboard-bold', 'solar:clipboard-bold-duotone');
export const ClipboardText        = makeIcon('solar:clipboard-text-bold', 'solar:clipboard-text-bold-duotone');

// ── Actions ──────────────────────────────────────────────────────────────────
export const MagnifyingGlass      = makeIcon('solar:magnifer-bold');
export const Copy                 = makeIcon('solar:copy-bold', 'solar:copy-bold-duotone');
export const Link                 = makeIcon('solar:link-bold');
export const LinkSimple           = makeIcon('solar:link-bold');
export const DownloadSimple       = makeIcon('solar:download-minimalistic-bold');
export const Upload               = makeIcon('solar:upload-minimalistic-bold');
export const UploadSimple         = makeIcon('solar:upload-minimalistic-bold');
export const UploadCloud          = makeIcon('solar:cloud-upload-bold', 'solar:cloud-upload-bold-duotone');
export const PencilSimple         = makeIcon('solar:pen-bold', 'solar:pen-bold-duotone');
export const Pencil               = makeIcon('solar:pen-bold', 'solar:pen-bold-duotone');
export const Trash                = makeIcon('solar:trash-bin-trash-bold', 'solar:trash-bin-trash-bold-duotone');
export const Plus                 = makeIcon('solar:add-circle-bold');
export const Minus                = makeIcon('solar:minus-circle-bold');
export const Check                = makeIcon('solar:check-bold');
export const X                    = makeIcon('solar:close-bold');
export const XCircle              = makeIcon('solar:close-circle-bold', 'solar:close-circle-bold-duotone');
export const List                 = makeIcon('solar:hamburger-menu-bold');
export const Eye                  = makeIcon('solar:eye-bold', 'solar:eye-bold-duotone');
export const EyeSlash             = makeIcon('solar:eye-closed-bold', 'solar:eye-closed-bold-duotone');
export const DotsThree            = makeIcon('solar:menu-dots-bold');
export const DotsThreeVertical    = makeIcon('solar:menu-dots-vertical-bold');
export const Share                = makeIcon('solar:share-bold', 'solar:share-bold-duotone');
export const ExternalLink         = makeIcon('solar:arrow-right-up-bold');

// ── Status & Feedback ────────────────────────────────────────────────────────
export const CheckCircle          = makeIcon('solar:check-circle-bold', 'solar:check-circle-bold-duotone');
export const Warning              = makeIcon('solar:danger-triangle-bold', 'solar:danger-triangle-bold-duotone');
export const WarningCircle        = makeIcon('solar:danger-circle-bold', 'solar:danger-circle-bold-duotone');
export const Info                 = makeIcon('solar:info-circle-bold', 'solar:info-circle-bold-duotone');
export const CircleNotch          = makeIcon('solar:refresh-circle-bold');
export const Spinner              = makeIcon('solar:refresh-circle-bold');
export const Shield               = makeIcon('solar:shield-bold', 'solar:shield-bold-duotone');
export const ShieldCheck          = makeIcon('solar:shield-check-bold', 'solar:shield-check-bold-duotone');
export const Seal                 = makeIcon('solar:verified-check-bold', 'solar:verified-check-bold-duotone');
export const Signature            = makeIcon('solar:pen-new-square-bold', 'solar:pen-new-square-bold-duotone');

// ── Calendar & Time ──────────────────────────────────────────────────────────
export const CalendarBlank        = makeIcon('solar:calendar-bold', 'solar:calendar-bold-duotone');
export const Calendar             = makeIcon('solar:calendar-bold', 'solar:calendar-bold-duotone');
export const CalendarCheck        = makeIcon('solar:calendar-check-bold', 'solar:calendar-check-bold-duotone');
export const CalendarPlus         = makeIcon('solar:calendar-add-bold', 'solar:calendar-add-bold-duotone');
export const Clock                = makeIcon('solar:clock-circle-bold', 'solar:clock-circle-bold-duotone');
export const ClockCounterClockwise = makeIcon('solar:history-bold', 'solar:history-bold-duotone');
export const Timer                = makeIcon('solar:clock-circle-bold', 'solar:clock-circle-bold-duotone');

// ── Finance ──────────────────────────────────────────────────────────────────
export const CurrencyDollar       = makeIcon('solar:dollar-minimalistic-bold', 'solar:dollar-minimalistic-bold-duotone');
export const CreditCard           = makeIcon('solar:card-bold', 'solar:card-bold-duotone');
export const ShoppingCart         = makeIcon('solar:cart-large-2-bold', 'solar:cart-large-2-bold-duotone');
export const Tag                  = makeIcon('solar:tag-bold', 'solar:tag-bold-duotone');
export const Coin                 = makeIcon('solar:dollar-minimalistic-bold', 'solar:dollar-minimalistic-bold-duotone');
export const HandCoins            = makeIcon('solar:hand-money-bold', 'solar:hand-money-bold-duotone');
export const Gift                 = makeIcon('solar:gift-bold', 'solar:gift-bold-duotone');
export const Wallet               = makeIcon('solar:wallet-bold', 'solar:wallet-bold-duotone');

// ── Education & Healthcare ───────────────────────────────────────────────────
export const GraduationCap        = makeIcon('solar:diploma-bold', 'solar:diploma-bold-duotone');
export const Certificate          = makeIcon('solar:diploma-bold', 'solar:diploma-bold-duotone');
export const BookOpen             = makeIcon('solar:book-bold', 'solar:book-bold-duotone');
export const Book                 = makeIcon('solar:book-bold', 'solar:book-bold-duotone');
export const Stethoscope          = makeIcon('solar:stethoscope-bold', 'solar:stethoscope-bold-duotone');
export const FirstAid             = makeIcon('solar:health-bold', 'solar:health-bold-duotone');
export const Hospital             = makeIcon('solar:hospital-bold', 'solar:hospital-bold-duotone');
export const Brain                = makeIcon('solar:programming-bold', 'solar:programming-bold-duotone');

// ── Work & Business ──────────────────────────────────────────────────────────
export const Briefcase            = makeIcon('solar:suitcase-bold', 'solar:suitcase-bold-duotone');
export const Buildings            = makeIcon('solar:buildings-bold', 'solar:buildings-bold-duotone');
export const MapPin               = makeIcon('solar:map-point-bold', 'solar:map-point-bold-duotone');
export const Globe                = makeIcon('solar:global-bold', 'solar:global-bold-duotone');
export const Airplane             = makeIcon('solar:airplane-bold', 'solar:airplane-bold-duotone');

// ── Media & Content ──────────────────────────────────────────────────────────
export const VideoCamera          = makeIcon('solar:camera-video-bold', 'solar:camera-video-bold-duotone');
export const Play                 = makeIcon('solar:play-bold', 'solar:play-bold-duotone');
export const Pause                = makeIcon('solar:pause-bold');
export const Stop                 = makeIcon('solar:stop-bold');
export const Microphone           = makeIcon('solar:microphone-bold', 'solar:microphone-bold-duotone');
export const Image                = makeIcon('solar:gallery-bold', 'solar:gallery-bold-duotone');
export const ImageSquare          = makeIcon('solar:gallery-bold', 'solar:gallery-bold-duotone');

// ── UI & Settings ────────────────────────────────────────────────────────────
export const GearSix              = makeIcon('solar:settings-bold', 'solar:settings-bold-duotone');
export const Gear                 = makeIcon('solar:settings-bold', 'solar:settings-bold-duotone');
export const Wrench               = makeIcon('solar:wrench-bold', 'solar:wrench-bold-duotone');
export const ChartLine            = makeIcon('solar:chart-2-bold', 'solar:chart-2-bold-duotone');
export const ChartBar             = makeIcon('solar:chart-bold', 'solar:chart-bold-duotone');
export const SignOut              = makeIcon('solar:logout-bold');
export const SignIn               = makeIcon('solar:login-bold');
export const LockKey              = makeIcon('solar:lock-bold', 'solar:lock-bold-duotone');
export const Lock                 = makeIcon('solar:lock-bold', 'solar:lock-bold-duotone');
export const LockOpen             = makeIcon('solar:lock-unlocked-bold', 'solar:lock-unlocked-bold-duotone');
export const SquaresFour          = makeIcon('solar:widget-5-bold', 'solar:widget-5-bold-duotone');
export const Star                 = makeIcon('solar:star-bold', 'solar:star-bold-duotone');
export const Heart                = makeIcon('solar:heart-bold', 'solar:heart-bold-duotone');
export const Lightning            = makeIcon('solar:bolt-bold', 'solar:bolt-bold-duotone');
export const Sparkle              = makeIcon('solar:magic-stick-bold', 'solar:magic-stick-bold-duotone');
export const Robot                = makeIcon('solar:robot-bold', 'solar:robot-bold-duotone');
export const Hash                 = makeIcon('solar:hashtag-bold');
export const At                   = makeIcon('solar:at-bold');
export const Question             = makeIcon('solar:question-circle-bold', 'solar:question-circle-bold-duotone');
export const Trophy               = makeIcon('solar:cup-star-bold', 'solar:cup-star-bold-duotone');
export const Medal                = makeIcon('solar:medal-star-bold', 'solar:medal-star-bold-duotone');
export const Headphones           = makeIcon('solar:headphones-bold', 'solar:headphones-bold-duotone');
export const Package              = makeIcon('solar:box-bold', 'solar:box-bold-duotone');
export const Swap                 = makeIcon('solar:transfer-horizontal-bold');

// ── Social ───────────────────────────────────────────────────────────────────
export const LinkedinLogo         = makeIcon('solar:linkedin-bold', 'solar:linkedin-bold-duotone');
export const FacebookLogo         = makeIcon('solar:facebook-bold', 'solar:facebook-bold-duotone');
export const TwitterLogo          = makeIcon('solar:twitter-bold');
export const XLogo                = makeIcon('solar:twitter-bold');
export const InstagramLogo        = makeIcon('solar:instagram-bold');
