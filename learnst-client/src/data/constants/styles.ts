export const chatStyles = `
<style>
  :root {
    --surface: #ffffff;
    --on-surface: #212121;
    --secondary-container: #e3f2fd;
    --on-secondary-container: #0d47a1;
  }

  body {
    font-family: Roboto, sans-serif;
    margin: 20px;
    background: var(--surface);
    color: var(--on-surface);
  }

  .chat-export {
    max-width: 600px;
    margin: 0 auto;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    padding: 20px;
  }

  .message {
    margin: 12px 0;
    padding: 12px 16px;
    border-radius: 20px;
    max-width: 80%;
  }

  .user-message {
    margin-left: auto;
    background: #f5f5f5;
    border-radius: 20px 20px 4px 20px;
  }

  .bot-message {
    border-radius: 20px 20px 20px 4px;
    background: var(--secondary-container);
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .timestamp {
    font-size: 0.8em;
    color: #666;
    margin-top: 10px;
  }
</style>
`;
export const tableStyles =
`
<style>
  .help-table {
    width: 100%;
    margin: 16px 0;
    overflow: hidden;
    border-collapse: collapse;
    color: var(--mat-sys-color-on-surface);
    background: var(--mat-sys-color-surface-container);
    border-radius: var(--mat-sys-shape-corner-extra-large);
  }

  .help-table th {
    text-align: left;
    padding: var(--mat-sys-spacing-3);
    color: var(--mat-sys-color-primary);
    background: var(--mat-sys-color-surface-container-high);
  }

  .help-table td {
    padding: var(--mat-sys-spacing-3);
    border-bottom: 1px solid var(--mat-sys-color-outline-variant);
  }

  .help-table code {
    padding: 2px 6px;
    color: var(--mat-sys-color-on-secondary-container);
    background: var(--mat-sys-color-secondary-container);
    border-radius: var(--mat-sys-shape-corner-extra-small);
  }

  .help-note {
    display: block;
    margin-top: var(--mat-sys-spacing-3);
    color: var(--mat-sys-color-on-surface-variant);
  }
</style>
`;
