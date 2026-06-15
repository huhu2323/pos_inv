# Changelog

All notable changes to Tofu POS Terminal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Sync button placeholder in Settings (UI only, no backend sync yet).
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

- Version bump release.

## [1.0.7] - 2026-06-15

### Changes

- 3 seperate print document, invoice, acknowledgement and official receipts
- Settings ui fixes and change
- Added sync button for future use