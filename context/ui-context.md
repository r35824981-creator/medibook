# UI Context

Design reference: the "Medical Center" dashboard screenshot shared by the developer. MediBook follows its layout, color roles, card style and chart style, adapted to appointment booking.

## Theme

Light theme only. The design language is a calm, modern medical dashboard: a soft gray page canvas, an off-white app area, borderless white cards with large rounded corners, and a strong black-and-blue contrast for navigation and actions. Data is shown through bold numbers, clean bars and colorful status cards rather than heavy tables and borders. Generous spacing, minimal shadows, and no gradients except the single AI/insight style highlight card (optional).

## Colors

All components must use these tokens. No hardcoded hex values.

| Role                  | CSS Variable         | Value     |
| --------------------- | -------------------- | --------- |
| Page canvas (outer)   | `--bg-page`          | `#EDEDEF` |
| App background        | `--bg-base`          | `#FAFAFA` |
| Surface (cards)       | `--bg-surface`       | `#FFFFFF` |
| Primary text          | `--text-primary`     | `#0A0A0A` |
| Muted text            | `--text-muted`       | `#6B7280` |
| Primary accent (CTA)  | `--accent-primary`   | `#2563EB` |
| Accent hover          | `--accent-hover`     | `#1D4ED8` |
| Active nav background | `--nav-active-bg`    | `#0A0A0A` |
| Active nav text       | `--nav-active-text`  | `#FFFFFF` |
| Border                | `--border-default`   | `#E5E7EB` |
| Error                 | `--state-error`      | `#DC2626` |
| Success               | `--state-success`    | `#2DB37E` |
| Warning               | `--state-warning`    | `#E8A800` |
| Critical              | `--state-critical`   | `#F26A3D` |

Alert card colors (solid fill, white text, translucent white "Resolve" or action button):

| Level    | Token              | Use in MediBook                                   |
| -------- | ------------------ | ------------------------------------------------- |
| Critical | `--state-critical` | Cancelled by doctor, failed reminder, urgent item |
| High     | `--state-warning`  | Pending appointment awaiting doctor confirmation  |
| Medium   | `--state-success`  | Confirmed or completed, informational             |

Chart colors:

| Role                      | CSS Variable | Value     |
| ------------------------- | ------------ | --------- |
| Series 1 (primary bars)   | `--chart-1`  | `#2563EB` |
| Series 2                  | `--chart-2`  | `#10B981` |
| Series 3                  | `--chart-3`  | `#D4C21A` |
| Series 4                  | `--chart-4`  | `#F58A3A` |
| Series 5 (dark)           | `--chart-5`  | `#0A0A0A` |
| Series 6 (neutral/beige)  | `--chart-6`  | `#D9C9B8` |

Appointment status badges (rounded-full pill, soft tint background, darker text of the same hue):

| Status    | Color token        |
| --------- | ------------------ |
| pending   | `--state-warning`  |
| confirmed | `--accent-primary` |
| completed | `--state-success`  |
| cancelled | `--text-muted`     |
| rejected  | `--state-error`    |

## Typography

| Role      | Font           | Variable      |
| --------- | -------------- | ------------- |
| UI text   | Inter          | `--font-sans` |
| Code/mono | JetBrains Mono | `--font-mono` |

Scale and weights:

- Page title and greeting: 24px, medium (500)
- Card title: 16px, medium
- Big metric number: 24 to 28px, medium
- Body text: 14px, regular
- Labels, captions, timestamps: 12px, regular, `--text-muted`
- Only two weights: 400 and 500

## Border Radius

| Context                         | Class          |
| ------------------------------- | -------------- |
| Inline / small UI (inputs, buttons, nav items) | `rounded-lg`   |
| Cards / panels (metric cards, chart cards, alert cards) | `rounded-2xl`  |
| Badges, avatar, icon tiles, pills | `rounded-full` or `rounded-xl` |
| Modals / overlays               | `rounded-2xl`  |
| App shell container             | `rounded-3xl` on desktop |

## Component Library

shadcn/ui on top of Tailwind, restyled with the tokens above. Components live in `src/components/ui/`. Use the CLI to add new components rather than writing them from scratch. Likely components: Button, Input, Select, Calendar, Dialog, Table, Badge, Tabs, Toast, Dropdown Menu, Avatar, Skeleton, Progress. Charts use Recharts, styled with the `--chart-*` tokens.

## Layout Patterns

- **App shell:** outer `--bg-page` canvas; inside it a rounded container with a fixed left sidebar (about 240px) and a main area. On mobile the sidebar becomes a slide-in drawer opened from a menu button
- **Sidebar:** brand name at the top, a search field with a shortcut hint, then nav items with an outline icon and label. The active item is a solid black pill (`--nav-active-bg`) with white text. A "Log out" item sits at the bottom
- **Top bar:** back arrow, breadcrumb (Home), then on the right a primary blue action button, a notification bell button, and the user avatar with name and a dropdown
- **Page header:** greeting ("Welcome, Dr. Morgan") with the full date underneath, next to a row of metric cards
- **Metric cards:** white, borderless, `rounded-2xl`. A small icon tile and label at top left, the big number at top right, a green or red "vs yesterday" change line, and a mini chart underneath. The dot-matrix mini chart is optional polish; a simple Recharts bar sparkline is acceptable
- **Progress rows (Staff Coverage style):** label on the left, a thick rounded blue bar with the percentage inside it. Use for doctor utilization or slots filled per department
- **Stacked capacity bar (Bed Capacity style):** one segmented horizontal bar with percentage labels and a legend below. Use for appointments by status
- **Alert cards (Critical Alerts style):** full-width solid-color `rounded-2xl` cards with a white icon tile on the left, a title, subtitle and detail text, a translucent action button at the top right and a relative time at the bottom right. Use for pending approvals and cancellations in the doctor and admin dashboards
- **Dashboard grid:** two columns below the metric row, wide cards on the left and the alert list on the right; one column on mobile
- **Booking flow (patient):** stepper with choose doctor, pick date, pick slot, confirm. Doctor cards in a grid; slots as a grid of time buttons; selected slot uses `--accent-primary`; a booked slot is muted with strikethrough
- **Primary actions:** at most one filled blue button per view
- **Tables (appointments, reports):** borderless rows on a white card with light dividers; stacked cards on mobile
- **Modals:** centered overlay with backdrop blur for confirm and cancel actions
- **Empty and loading states:** skeleton loaders, and a short friendly message with a clear next action
- **Public pages (landing, login, register):** centered card on the `--bg-page` canvas

Role dashboards:

| Role    | Sidebar items                                                       |
| ------- | ------------------------------------------------------------------- |
| Patient | Home, Find Doctors, My Appointments, Profile                        |
| Doctor  | Home, Appointments, Availability, Time Off, Profile                 |
| Admin   | Home, Doctors, Departments, Appointments, Reports, Settings         |

## Icons

Lucide React. Stroke-based outline icons only. Sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons and nav items. Icon tiles (in cards and alerts) are a `rounded-xl` square with a translucent background of the card color.

## Do and Don't

- Do keep cards borderless on the gray canvas; separation comes from color and spacing
- Do use black for the active nav and blue for the main call to action
- Do use the alert card colors only for status and urgency, not decoration
- Don't add drop shadows, gradients or extra accent colors
- Don't put more than one primary blue button in a view
