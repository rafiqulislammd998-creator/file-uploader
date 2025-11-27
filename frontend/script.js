class FileUploader {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.checkAuthentication();
        this.loadUserData();
    }

    initializeEventListeners() {
        // Login/Register forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const registerBtn = document.getElementById('registerBtn');
        const loginBtn = document.getElementById('loginBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.toggleAuthForms());
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.toggleAuthForms());
        }

        // Dashboard functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && fileInput) {
            this.initializeFileUpload(uploadArea, fileInput);
        }

        // Tab navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });
    }

    checkAuthentication() {
        if (window.location.pathname.includes('dashboard.html') && !this.token) {
            window.location.href = 'login.html';
            return;
        }

        if ((window.location.pathname.includes('login.html') || 
             window.location.pathname === '/') && this.token) {
            window.location.href = 'dashboard.html';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.token = result.token;
                this.currentUser = result.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage('Registration successful! Please login.', 'success');
                this.toggleAuthForms();
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Registration failed. Please try again.', 'error');
        }
    }

    toggleAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    loadUserData() {
        if (this.currentUser) {
            const welcomeElement = document.getElementById('userWelcome');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');

            if (welcomeElement) {
                welcomeElement.textContent = `Welcome, ${this.currentUser.name}`;
            }

            if (profileName) {
                profileName.textContent = this.currentUser.name;
            }

            if (profileEmail) {
                profileEmail.textContent = this.currentUser.email;
            }
        }
    }

    initializeFileUpload(uploadArea, fileInput) {
        // Click to select files
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    async handleFiles(files) {
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const uploadedFiles = document.getElementById('uploadedFiles');

        progressContainer.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressFill.style.width = percentComplete + '%';
                        progressText.textContent = Math.round(percentComplete) + '%';
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        this.displayUploadedFile(response.file, uploadedFiles);
                    } else {
                        this.showMessage('Upload failed for ' + file.name, 'error');
                    }
                });

                xhr.open('POST', '/api/upload');
                xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
                xhr.send(formData);

            } catch (error) {
                this.showMessage('Upload failed: ' + error.message, 'error');
            }
        }
    }

    displayUploadedFile(fileInfo, container) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-card';
        fileElement.innerHTML = `
            <i class="fas fa-file"></i>
            <h4>${fileInfo.originalName}</h4>
            <p>${this.formatFileSize(fileInfo.size)}</p>
            <a href="${fileInfo.url}" target="_blank" class="btn-primary">Download</a>
        `;
        container.appendChild(fileElement);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    switchTab(e) {
        e.preventDefault();
        const targetTab = e.target.getAttribute('data-tab') || 
                         e.target.closest('.menu-item').getAttribute('data-tab');

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        e.target.closest('.menu-item').classList.add('active');

        // Show target tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(targetTab).classList.add('active');

        // Load content if needed
        if (targetTab === 'files') {
            this.loadUserFiles();
        } else if (targetTab === 'profile') {
            this.loadUserProfile();
        }
    }

    async loadUserFiles() {
        try {
            const response = await fetch('/api/files', {
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }

    displayFiles(files) {
        const filesGrid = document.getElementById('filesGrid');
        filesGrid.innerHTML = '';

        files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-card';
            fileElement.innerHTML = `
                <i class="fas fa-file"></i>
                <h4>${file.name}</h4>
                <p>${this.formatFileSize(file.size)}</p>
                <p class="upload-date">${new Date(file.uploadDate).toLocaleDateString()}</p>
                <a href="${file.url}" target="_blank" class="btn-primary">Download</a>
            `;
            filesGrid.appendChild(fileElement);
        });
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayProfile(data.user);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    displayProfile(user) {
        // Profile data is already loaded in loadUserData
        const profileSince = document.getElementById('profileSince');
        if (profileSince) {
            profileSince.textContent = new Date().getFullYear();
        }
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `message ${type}`;
            messageElement.classList.remove('hidden');

            setTimeout(() => {
                messageElement.classList.add('hidden');
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FileUploader();
});