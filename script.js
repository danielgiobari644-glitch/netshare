/**
 * WiFi QR Connect - Pure JS Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const ssidInput = document.getElementById('ssid');
    const passwordInput = document.getElementById('password');
    const encryptionSelect = document.getElementById('encryption');
    const hiddenCheckbox = document.getElementById('hidden');
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeContainer = document.getElementById('qrcode');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrActions = document.getElementById('qrActions');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');

    let qrcode = null;

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update icon
        const icon = togglePasswordBtn.querySelector('svg');
        if (type === 'text') {
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        } else {
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
    });

    // Generate QR Code
    generateBtn.addEventListener('click', () => {
        const ssid = ssidInput.value.trim();
        const password = passwordInput.value;
        const encryption = encryptionSelect.value;
        const isHidden = hiddenCheckbox.checked;

        if (!ssid) {
            alert('Please enter a Network Name (SSID)');
            return;
        }

        // Clear previous QR Code
        qrcodeContainer.innerHTML = '';
        qrcodeContainer.style.display = 'block';
        qrPlaceholder.style.display = 'none';
        qrActions.style.display = 'flex';

        // WiFi QR format: WIFI:S:<SSID>;T:<TYPE>;P:<PASSWORD>;H:<HIDDEN>;;
        // Escape special characters in SSID and Password
        const escape = (str) => {
            return str.replace(/\\/g, '\\\\')
                      .replace(/;/g, '\\;')
                      .replace(/:/g, '\\:')
                      .replace(/,/g, '\\,');
        };

        const wifiString = `WIFI:S:${escape(ssid)};T:${encryption === 'nopass' ? '' : encryption};P:${encryption === 'nopass' ? '' : escape(password)};H:${isHidden};;`;

        // Create QR Code
        qrcode = new QRCode(qrcodeContainer, {
            text: wifiString,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Small timeout to ensure image is rendered for download
        setTimeout(() => {
            const img = qrcodeContainer.querySelector('img');
            if (img) {
                img.style.margin = '0 auto';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        }, 100);
    });

    // Download QR Code
    downloadBtn.addEventListener('click', () => {
        const img = qrcodeContainer.querySelector('img');
        if (!img) return;

        const link = document.createElement('a');
        link.download = `WiFi_QR_${ssidInput.value || 'Connect'}.png`;
        link.href = img.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Print functionality
    printBtn.addEventListener('click', () => {
        const img = qrcodeContainer.querySelector('img');
        if (!img) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print WiFi QR</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        h1 { margin-bottom: 20px; }
                        img { width: 300px; height: 300px; }
                        p { margin-top: 20px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>WiFi: ${ssidInput.value}</h1>
                    <img src="${img.src}">
                    <p>Scan to connect instantly</p>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    });
});
