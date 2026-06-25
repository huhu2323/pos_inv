# Changelog

All notable changes to Tofu POS Terminal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.6]

### Added

- Initial setup offers Setup from scratch or Connect to Tofu Admin; the connect path pulls all POS settings (master password, VAT, auto print, barcode scanning, invoice/receipt headers) using tenant ID and POS ID.
- Critical stock alert level (out of stock, critical, low) derived from unit thresholds and initial quantity, shown on dashboard, inventory, and header notifier.
- POS sync now uses tenant ID, POS ID, and Tofu Admin API URL only (no user email/password).
- Low stock alert notifier in the header for employees and admins, with per-product unit thresholds (up to initial qty minus 1).
- Dashboard low stock alerts table sorted by lowest current stock.
- Product and variant low stock alert settings on create/edit, synced to the cloud catalog.
- Server sync for products, sales, and invoices from Settings using API credentials and tenant ID.
- Product unit of measure (kg, pc, liter) on product creation, inventory, and synced catalog data.
- Sync settings fields for API URL, tenant ID, email, and password.

### Fixed

- Low stock alerts now evaluate variant inventory (inheriting product thresholds when a variant has alerts off) instead of unused base product quantity on variant products.

### Changed

- POS opens with the product grid visible, sorted by most purchased items from completed sales.
- Sync settings replaced API email/password with POS ID; point API URL at Tofu Admin instead of the backend directly.
- Low stock alerts use unit thresholds only; percentage-based alerts were removed.
- Full UI overhaul from Stitch mockups: sidebar shell with Store Manager branding, light top header, cart-table POS layout with payment panel, dashboard metric cards and recent transactions, and consistent table/card patterns across admin pages.
- UI refreshed with the Stitch "Precision POS" design system: deep blue primary, cyan CTAs, green complete-sale actions, Inter/Hanken Grotesk/JetBrains Mono typography, bordered cards, and 280px sidebar.
- Invoices sidebar menu replaced with Receipts, showing all document types in one place.
- Sync button in Settings now pushes only new records, matched by local UUID.
- Official Receipt and Acknowledgement Receipt print formats.
- Official Receipt header and footer settings.
- Auto Print setting with Off, Official Receipt, Invoice, and Acknowledgement Receipt options.

### Changed

- Settings page sections use individual cards in a responsive three-column grid.
- Initial setup now sets the master password from the first admin account password.
- Settings are initialized in the database on first read, with booleans and defaults persisted.
- Auto-invoice toggle replaced with Auto Print radio group (defaults to Off).
- Invoice receipt settings renamed to Invoice header and footer.
- Sales page adds Official Receipt and Acknowledgement Receipt print actions.
- Printed documents show a bold title header: Invoice, Official Receipt, or Acknowledgement Receipt.

## [1.0.5] - 2026-06-11

### Changed
