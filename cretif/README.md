# Certificate Template (optional)

By default, certificates are **generated entirely in code** (SVG → JPEG) with a navy & gold layout—**no file is required**.

If you add `arena_Certificate.jpg` here, the service will **overlay** name, hackathon, and date on your image instead.

## Requirements
- File name: `arena_Certificate.jpg`
- Recommended size: 1360×960 px (or similar landscape format)
- The service will overlay text at approximately:
  - **Name**: vertical center (50% height)
  - **Hackathon name**: 60% height
  - **Date**: 68% height

## Usage
The certificate image is generated when `POST /certificate/generate` is called by an authenticated user.
