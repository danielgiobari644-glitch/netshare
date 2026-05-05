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
    const detectBtn = document.getElementById('detectBtn');
    const scanBtn = document.getElementById('scanBtn');
    const scannerOverlay = document.getElementById('scannerOverlay');
    const closeScanner = document.getElementById('closeScanner');
    const qrcodeFrame = document.getElementById('qrcode-frame');
    const frameLabel = document.getElementById('frameLabel');
    const stylePicker = document.getElementById('stylePicker');

    let qrcode = null;
    let html5QrCode = null;
    let currentStyle = 'standard';

    // QR Scanning Logic
    const startScanner = async () => {
        scannerOverlay.style.display = 'flex';
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        try {
            await html5QrCode.start(
                { facingMode: "environment" }, 
                config,
                (decodedText) => {
                    parseWifiQR(decodedText);
                    stopScanner();
                }
            );
        } catch (err) {
            console.error("Scanner error:", err);
            alert("Could not start camera. Please ensure you have given permission.");
            stopScanner();
        }
    };

    const stopScanner = () => {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                scannerOverlay.style.display = 'none';
            }).catch(err => {
                console.error("Stop error:", err);
                scannerOverlay.style.display = 'none';
            });
        } else {
            scannerOverlay.style.display = 'none';
        }
    };

    const parseWifiQR = (text) => {
        if (!text.startsWith('WIFI:')) {
            alert("This doesn't look like a WiFi QR code.");
            return;
        }

        const ssidMatch = text.match(/S:([^;]+);/);
        const passMatch = text.match(/P:([^;]+);/);
        const encMatch = text.match(/T:([^;]*);/);
        const hidMatch = text.match(/H:([^;]+);/);

        if (ssidMatch) ssidInput.value = unescapeWifi(ssidMatch[1]);
        if (passMatch) passwordInput.value = unescapeWifi(passMatch[1]);
        if (encMatch) encryptionSelect.value = encMatch[1] || 'nopass';
        if (hidMatch) hiddenCheckbox.checked = hidMatch[1] === 'true';
        
        generateBtn.click();
    };

    const unescapeWifi = (str) => {
        return str.replace(/\\;/g, ';')
                  .replace(/\\:/g, ':')
                  .replace(/\\,/g, ',')
                  .replace(/\\\\/g, '\\');
    };

    scanBtn.addEventListener('click', startScanner);
    closeScanner.addEventListener('click', stopScanner);

    // Style Selection
    stylePicker.addEventListener('click', (e) => {
        if (!e.target.classList.contains('style-option')) return;
        
        stylePicker.querySelectorAll('.style-option').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        currentStyle = e.target.dataset.style;
        qrcodeFrame.className = `style-${currentStyle}`;
    });

    // Network Status Refresh
    detectBtn.addEventListener('click', () => {
        updateNetworkStatus();
        const status = navigator.onLine ? 'Online' : 'Offline';
        alert(`Status: ${status}. Browser policies restrict access to nearby WiFi lists for privacy. Use "Scan QR" to import from a router or existing safe code.`);
    });
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

        // Update Frame Label
        frameLabel.textContent = ssid;

        // Clear previous QR Code
        qrcodeContainer.innerHTML = '';
        qrcodeContainer.style.display = 'block';
        qrcodeFrame.style.display = 'flex';
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

    // Download QR Code with Styles
    downloadBtn.addEventListener('click', () => {
        const qrImg = qrcodeContainer.querySelector('img');
        if (!qrImg) return;

        // Create a temporary canvas to draw the framed QR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let canvasWidth = 400;
        let canvasHeight = 400;
        
        if (currentStyle === 'card') {
            canvasHeight = 500;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Backgrounds
        if (currentStyle === 'modern') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Shadow effect (simplified)
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        } else if (currentStyle === 'card') {
            const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#f0f0f0');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8);
        } else {
            // Standard
            ctx.fillStyle = 'rgba(255, 255, 255, 0)';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Draw QR
        const qrSize = 256;
        const x = (canvasWidth - qrSize) / 2;
        const y = (currentStyle === 'card') ? 80 : (canvasHeight - qrSize) / 2;
        
        // QR background (white box)
        if (currentStyle !== 'standard') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 10, y - 10, qrSize + 20, qrSize + 20);
        }
        
        ctx.drawImage(qrImg, x, y, qrSize, qrSize);

        // Labels
        if (currentStyle === 'card') {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`WiFi: ${ssidInput.value}`, canvasWidth / 2, y + qrSize + 60);
            ctx.font = '14px sans-serif';
            ctx.fillText('Scan to connect instantly', canvasWidth / 2, 40);
        }

        const link = document.createElement('a');
        link.download = `NetShare_${ssidInput.value || 'WiFi'}.png`;
        link.href = canvas.toDataURL('image/png');
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
