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
    const historyContainer = document.getElementById('historyContainer');
    const historyList = document.getElementById('historyList');
    const networkStatusDot = document.querySelector('.status-dot');

    let qrcode = null;
    let savedNetworks = JSON.parse(localStorage.getItem('wifi_history') || '[]');

    // Initialize Network Status
    const updateNetworkStatus = () => {
        if (navigator.onLine) {
            networkStatusDot.classList.add('online');
            document.getElementById('networkStatus').title = `Connected to ${navigator.connection?.type || 'network'}`;
        } else {
            networkStatusDot.classList.remove('online');
            document.getElementById('networkStatus').title = 'Offline';
        }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    // Render Saved Networks
    const renderHistory = () => {
        if (savedNetworks.length === 0) {
            historyContainer.style.display = 'none';
            return;
        }

        historyContainer.style.display = 'block';
        historyList.innerHTML = '';
        
        savedNetworks.forEach((net, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-info" onclick="loadNetwork(${index})">
                    <span class="history-ssid">${net.ssid}</span>
                    <span class="history-meta">${net.encryption === 'nopass' ? 'Open' : net.encryption} • ${net.date}</span>
                </div>
                <div class="history-actions">
                    <button class="history-btn delete" onclick="deleteNetwork(event, ${index})" title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            historyList.appendChild(item);
        });
    };

    window.loadNetwork = (index) => {
        const net = savedNetworks[index];
        ssidInput.value = net.ssid;
        passwordInput.value = net.password;
        encryptionSelect.value = net.encryption;
        hiddenCheckbox.checked = net.isHidden;
        generateBtn.click();
    };

    window.deleteNetwork = (e, index) => {
        e.stopPropagation();
        savedNetworks.splice(index, 1);
        localStorage.setItem('wifi_history', JSON.stringify(savedNetworks));
        renderHistory();
    };

    renderHistory();

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

        // Save to History (if not already there or uniquely update)
        const newNet = {
            ssid, 
            password, 
            encryption, 
            isHidden, 
            date: new Date().toLocaleDateString()
        };

        // Remove existing duplicate SSID to put it at top
        savedNetworks = savedNetworks.filter(n => n.ssid !== ssid);
        savedNetworks.unshift(newNet);
        // Limit to last 10
        if (savedNetworks.length > 10) savedNetworks.pop();
        
        localStorage.setItem('wifi_history', JSON.stringify(savedNetworks));
        renderHistory();

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
