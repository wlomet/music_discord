# Planning Guide

A comprehensive web dashboard for administering and monitoring a Discord music bot, providing real-time control over music playback, queue management, statistics visualization, and system logs.

**Experience Qualities**: 
1. **Professional** - Clean, organized interface that conveys technical competence and reliability for bot administration
2. **Responsive** - Real-time updates and smooth interactions that make the dashboard feel alive and connected to the bot
3. **Efficient** - Quick access to critical controls and information without unnecessary navigation or complexity

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-view admin dashboard with real-time data updates, interactive controls, data visualization, queue management, and historical analytics. It requires coordinated state management across multiple features and simulated backend communication.

## Essential Features

### Dashboard Overview
- **Functionality**: Display real-time bot status, metrics, and currently playing track
- **Purpose**: Provide at-a-glance system health and activity monitoring
- **Trigger**: User navigates to root route or clicks "Dashboard" in sidebar
- **Progression**: Load dashboard → Fetch bot status → Display metrics cards (status, guild count, voice channels, queue size, uptime) → Show current track with progress bar → Auto-refresh every 5 seconds
- **Success criteria**: All metrics display correctly, current track updates in real-time, progress bar animates smoothly

### Music Control Panel
- **Functionality**: Control playback (play, pause, resume, skip, stop) and add new tracks
- **Trigger**: User navigates to /music route
- **Progression**: Load music page → Display current track with elapsed/remaining time → User clicks control button → Send command → Update UI state → Show toast notification → Refresh current track info
- **Success criteria**: All playback controls respond immediately, track info updates after actions, add track form validates YouTube URLs

### Queue Management
- **Functionality**: View, reorder, and remove tracks from the music queue
- **Trigger**: User navigates to /queue route or views queue section on music page
- **Progression**: Load queue → Display tracks table with position/title/URL → User drags track or clicks reorder buttons → Update queue positions → Save to storage → Update display
- **Success criteria**: Queue displays all tracks, reordering works smoothly, delete removes tracks instantly

### Playback History
- **Functionality**: View paginated history of all previously played tracks
- **Trigger**: User navigates to /history route
- **Progression**: Load history page → Fetch played tracks from storage → Display paginated table → User clicks page navigation → Load new page → Update display
- **Success criteria**: History shows all played tracks with timestamps, pagination works correctly (10 items per page)

### Statistics Dashboard
- **Functionality**: Visualize bot usage with charts (top tracks, daily plays, cumulative listening time, weekly activity)
- **Trigger**: User navigates to /stats route
- **Progression**: Load stats page → Fetch aggregated data → Render Chart.js graphs → User hovers over data points → Display tooltips → Charts animate on load
- **Success criteria**: All 4 charts render correctly, data is accurate, charts are interactive and visually appealing

### Real-time Logs
- **Functionality**: Stream live system logs (commands, errors, queue changes, playback events)
- **Trigger**: User navigates to /logs route
- **Progression**: Load logs page → Connect to log stream → Display logs with color-coded levels → New log arrives → Append to display → Auto-scroll to bottom
- **Success criteria**: Logs appear in real-time, different log levels have distinct styling, auto-scroll works, logs are readable

## Edge Case Handling

- **Empty States**: Display helpful messages when no track is playing, queue is empty, or no history exists
- **Invalid URLs**: Validate YouTube URLs before adding to queue, show error toast for invalid input
- **Offline Bot**: Show clear "Bot Offline" indicator when bot is disconnected, disable controls
- **Long Track Titles**: Truncate with ellipsis and show full title on hover
- **Network Errors**: Display error toasts when simulated API calls fail, retry mechanisms
- **Concurrent Actions**: Prevent multiple simultaneous control commands with loading states
- **Data Persistence**: All queue, history, and settings persist across page refreshes using KV store

## Design Direction

The design should evoke the feeling of a professional command center - dark, focused, and technical yet approachable. It should feel like a powerful tool that music bot administrators trust for critical operations, combining the precision of developer tools with the polish of modern SaaS dashboards.

## Color Selection

A dark cyberpunk-inspired palette with electric accents and high contrast for readability during extended monitoring sessions.

- **Primary Color**: Electric Purple (oklch(0.55 0.25 290)) - Conveys energy and modernity, used for primary actions and brand elements
- **Secondary Colors**: 
  - Deep Navy Background (oklch(0.15 0.02 250)) - Professional dark base
  - Slate Card Background (oklch(0.20 0.02 250)) - Elevated surfaces
  - Charcoal Border (oklch(0.30 0.01 250)) - Subtle separators
- **Accent Color**: Cyan Highlight (oklch(0.75 0.15 200)) - CTAs, success states, and active indicators
- **Foreground/Background Pairings**: 
  - Background Navy (oklch(0.15 0.02 250)): White text (oklch(0.97 0 0)) - Ratio 11.2:1 ✓
  - Card Slate (oklch(0.20 0.02 250)): Light Gray text (oklch(0.90 0 0)) - Ratio 9.8:1 ✓
  - Primary Purple (oklch(0.55 0.25 290)): White text (oklch(0.97 0 0)) - Ratio 4.9:1 ✓
  - Accent Cyan (oklch(0.75 0.15 200)): Navy text (oklch(0.15 0.02 250)) - Ratio 7.1:1 ✓
  - Success Green (oklch(0.65 0.18 150)): Navy text (oklch(0.15 0.02 250)) - Ratio 5.8:1 ✓
  - Destructive Red (oklch(0.60 0.22 25)): White text (oklch(0.97 0 0)) - Ratio 4.7:1 ✓

## Font Selection

Technical precision meets readability - a monospace font for data and metrics paired with a clean geometric sans-serif for UI text.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter spacing
  - H2 (Section Heading): Space Grotesk SemiBold/24px/normal
  - H3 (Card Title): Space Grotesk Medium/18px/normal
  - Body Text: Space Grotesk Regular/15px/relaxed line height (1.6)
  - Metric Values: JetBrains Mono Bold/28px/tabular numbers
  - Data Tables: JetBrains Mono Regular/14px/tabular layout
  - Timestamps: JetBrains Mono Regular/13px/muted color

## Animations

Animations should feel responsive and technical, emphasizing state changes and data updates with quick, precise transitions. Use motion to guide attention to new information (logs appearing, queue updates) while keeping the interface feeling snappy and professional.

- Smooth progress bar animation for current track (linear timing)
- Fade-in for new log entries (150ms ease-out)
- Slide-in for toast notifications (200ms spring)
- Pulse animation on live indicators (2s infinite)
- Quick button press feedback (100ms scale)
- Chart entrance animations (400ms ease-out stagger)
- Sidebar navigation transitions (250ms ease-in-out)

## Component Selection

- **Components**: 
  - Sidebar navigation for main menu (shadcn Sidebar component with custom styling)
  - Card for metric displays and content sections (shadcn Card)
  - Button for all actions with variants (default, destructive, ghost) (shadcn Button)
  - Input and Form for add track functionality (shadcn Input, Form with react-hook-form)
  - Table for queue, history displays (shadcn Table with sorting)
  - Progress bar for track playback (shadcn Progress with custom gradient)
  - Badge for status indicators (shadcn Badge)
  - Tabs for switching between views within sections (shadcn Tabs)
  - Toast for notifications (sonner)
  - Scroll Area for logs and long lists (shadcn ScrollArea)
  - Separator for visual divisions (shadcn Separator)
  - Skeleton for loading states (shadcn Skeleton)

- **Customizations**: 
  - Custom Chart components using recharts for statistics visualization
  - Live log stream component with auto-scroll and color-coded levels
  - Custom audio visualizer component for currently playing track
  - Real-time status indicator with pulse animation
  - Custom queue reordering interface with drag handles

- **States**: 
  - Buttons: Subtle glow on hover, pressed state with scale, disabled with reduced opacity
  - Inputs: Cyan border on focus, error state with red border and shake animation
  - Cards: Subtle lift on hover for interactive cards, border glow for active states
  - Table rows: Highlight on hover, selected state with accent background
  - Status indicators: Pulsing dot for online, static gray for offline, yellow for issues

- **Icon Selection**: 
  - Play (Play), Pause (Pause), Stop (Stop), Skip (SkipForward) from Phosphor
  - Music notes (MusicNotes), Queue (Queue), History (ClockCounterClockwise)
  - Stats (ChartBar), Logs (Terminal), Dashboard (SquaresFour)
  - Add (Plus), Delete (Trash), Reorder (ArrowsDownUp)
  - Status indicators (CheckCircle, XCircle, WarningCircle)

- **Spacing**: 
  - Page padding: p-6 on desktop, p-4 on mobile
  - Card padding: p-6
  - Section gaps: gap-6 for main layout grid
  - Card internal spacing: gap-4 between elements
  - Button groups: gap-2
  - Table cell padding: px-4 py-3

- **Mobile**: 
  - Sidebar collapses to slide-out drawer on mobile (<768px)
  - Metric cards stack vertically in single column
  - Tables become horizontally scrollable
  - Chart height reduces for mobile viewport
  - Control buttons stack vertically when needed
  - Reduced padding (p-4 → p-3) for tighter mobile layout
