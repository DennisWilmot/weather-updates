export function generatePopupHTML(
    properties: Record<string, any>,
    layer: 'people' | 'places' | 'assets'
): string {
    const color =
        layer === 'people'
            ? '#FF6B6B'
            : layer === 'places'
                ? '#4ECDC4'
                : '#45B7D1';

    const iconSVG = {
        user: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke="none" d="M0 0h24v24H0z"/><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`,

        phone: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M4 4h5l2 5l-2 2a12 12 0 0 0 6 6l2-2l5 2v5a1 1 0 0 1 -1 1a17 17 0 0 1 -17-17a1 1 0 0 1 1 -1"/></svg>`,

        mail: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M3 7l9 6l9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`,

        pin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M12 11m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M8 11c0 4.418 2.686 8 4 8s4-3.582 4-8a4 4 0 1 0 -8 0"/></svg>`,

        building: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M3 21v-13l9-4l9 4v13"/><path d="M13 13h4v8h-10v-6h6v6"/></svg>`,

        box: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" stroke-width="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M12 3l8 4.5l-8 4.5l-8-4.5z"/><path d="M4 7.5v9l8 4.5l8-4.5v-9"/></svg>`
    };

    const pretty = (text: string) =>
        text ? text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

    let html = `
      <div style="
        width: 280px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0,0,0,0.16);
        font-family: system-ui, sans-serif;
        background: white;
      ">
  
        <!-- Header -->
        <div style="
          background: #1a1a3c;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: ${color};
            border-radius: 50%;
          "></div>
  
          <div style="color: white; font-weight: 600; font-size: 16px;">
            ${properties.name || 'Unknown'}
          </div>
        </div>
  
        <div style="padding: 14px 16px;">
  
          <div style="
            display: inline-block;
            background: ${color}20;
            color: ${color};
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 6px;
            font-weight: 600;
            margin-bottom: 10px;
          ">
            ${pretty(properties.type)}
          </div>
    `;

    // PEOPLE
    if (layer === 'people') {
        if (properties.contactName)
            html += `
          <div style="margin: 6px 0; display:flex; align-items:center; gap:6px;">
            ${iconSVG.user} <span>${properties.contactName}</span>
          </div>`;

        if (properties.contactPhone)
            html += `
          <div style="margin: 6px 0; display:flex; align-items:center; gap:6px;">
            ${iconSVG.phone} <span>${properties.contactPhone}</span>
          </div>`;

        if (properties.contactEmail)
            html += `
          <div style="margin: 6px 0; display:flex; align-items:center; gap:6px; word-break: break-word;">
            ${iconSVG.mail} <span>${properties.contactEmail}</span>
          </div>`;

        if (properties.organization)
            html += `
          <div style="margin: 6px 0; display:flex; align-items:center; gap:6px;">
            ${iconSVG.building} <span>${properties.organization}</span>
          </div>`;
    }

    // PLACES
    if (layer === 'places') {
        if (properties.address)
            html += `
          <div style="margin: 6px 0; display:flex; gap:6px; align-items:center;">
            ${iconSVG.pin} <span>${properties.address}</span>
          </div>`;

        if (properties.maxCapacity)
            html += `<div style="margin:6px 0;"><strong>Capacity:</strong> ${properties.maxCapacity}</div>`;

        if (properties.description)
            html += `<div style="margin:6px 0; font-size:13px; color:#666;">${properties.description}</div>`;

        if (properties.verified)
            html += `
          <div style="margin:6px 0;">
            <span style="
              background:#51cf66;
              color:white;
              padding:2px 8px;
              font-size:11px;
              border-radius:4px;
            ">Verified</span>
          </div>`;
    }

    // ASSETS
    if (layer === 'assets') {
        if (properties.serialNumber)
            html += `<div style="margin:6px 0;"><strong>Serial:</strong> ${properties.serialNumber}</div>`;

        if (properties.status)
            html += `
          <div style="margin: 6px 0;">
            <span style="
              background:${color};
              color:white;
              padding:4px 8px;
              border-radius:6px;
              font-size:12px;
            ">
              ${pretty(properties.status)}
            </span>
          </div>`;

        if (properties.currentLocation)
            html += `
          <div style="margin:6px 0; display:flex; gap:6px; align-items:center;">
            ${iconSVG.pin} <span>${properties.currentLocation}</span>
          </div>`;

        if (properties.organization)
            html += `
          <div style="margin:6px 0; display:flex; gap:6px; align-items:center;">
            ${iconSVG.building} <span>${properties.organization}</span>
          </div>`;
    }

    // LOCATION (COMMON)
    if (properties.communityName || properties.parishName) {
        html += `
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid #eee;">
          <div style="font-size:12px; color:#888;">
            ${(properties.communityName || '')}
            ${properties.communityName && properties.parishName ? ', ' : ''}
            ${(properties.parishName || '')}
          </div>
        </div>`;
    }

    html += `
        </div>
      </div>
    `;

    return html;
}
