/**
 * InputHandler Class - Comprehensive input handling for iPhone and Mac
 * Handles platform-specific input behaviors and optimizations
 */
class InputHandler {
    constructor() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isMac = /Mac|Macintosh/.test(navigator.userAgent);
        this.isTouch = 'ontouchstart' in window;
        this.viewport = document.querySelector('meta[name="viewport"]');
        this.originalViewport = this.viewport ? this.viewport.content : '';
        
        this.init();
    }
    
    init() {
        this.setupViewportHandling();
        this.setupInputEventListeners();
        this.setupKeyboardHandling();
        this.setupFocusManagement();
        this.setupPlatformOptimizations();
    }
    
    /**
     * Setup viewport handling for iOS keyboard
     */
    setupViewportHandling() {
        if (!this.isIOS) return;
        
        // Prevent zoom on input focus
        document.addEventListener('focusin', (e) => {
            if (this.isInputElement(e.target)) {
                this.disableViewportZoom();
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (this.isInputElement(e.target)) {
                this.restoreViewportZoom();
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }
    
    /**
     * Setup comprehensive input event listeners
     */
    setupInputEventListeners() {
        document.addEventListener('input', (e) => {
            if (this.isInputElement(e.target)) {
                this.handleInputChange(e);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isInputElement(e.target)) {
                this.handleKeyDown(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isInputElement(e.target)) {
                this.handleKeyUp(e);
            }
        });
    }
    
    /**
     * Setup keyboard specific handling
     */
    setupKeyboardHandling() {
        if (this.isIOS) {
            this.setupIOSKeyboardHandling();
        }
        
        if (this.isMac) {
            this.setupMacKeyboardHandling();
        }
    }
    
    /**
     * iOS specific keyboard handling
     */
    setupIOSKeyboardHandling() {
        let keyboardHeight = 0;
        
        // Detect keyboard show/hide
        window.addEventListener('resize', () => {
            this.handleIOSKeyboard();
        });
        
        // Handle visual viewport for iOS 13+
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleVisualViewportChange();
            });
        }
    }
    
    /**
     * Mac specific keyboard handling
     */
    setupMacKeyboardHandling() {
        document.addEventListener('keydown', (e) => {
            if (this.isInputElement(e.target)) {
                // Handle Mac-specific keyboard shortcuts
                if (e.metaKey) {
                    this.handleMacKeyboardShortcuts(e);
                }
            }
        });
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        let activeInput = null;
        
        document.addEventListener('focusin', (e) => {
            if (this.isInputElement(e.target)) {
                activeInput = e.target;
                this.handleInputFocus(e.target);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (this.isInputElement(e.target)) {
                this.handleInputBlur(e.target);
                activeInput = null;
            }
        });
        
        // Store reference to active input
        this.getActiveInput = () => activeInput;
    }
    
    /**
     * Setup platform-specific optimizations
     */
    setupPlatformOptimizations() {
        if (this.isIOS) {
            this.setupIOSOptimizations();
        }
        
        if (this.isMac) {
            this.setupMacOptimizations();
        }
    }
    
    /**
     * iOS specific optimizations
     */
    setupIOSOptimizations() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                if (this.isInputElement(e.target)) {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        }, false);
        
        // Optimize scroll behavior
        document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    /**
     * Mac specific optimizations
     */
    setupMacOptimizations() {
        // Enhanced smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Optimize text rendering
        document.body.style.webkitFontSmoothing = 'antialiased';
        document.body.style.mozOsxFontSmoothing = 'grayscale';
    }
    
    /**
     * Check if element is an input
     */
    isInputElement(element) {
        return element && (
            element.tagName === 'INPUT' || 
            element.tagName === 'TEXTAREA' ||
            element.contentEditable === 'true'
        );
    }
    
    /**
     * Handle input focus
     */
    handleInputFocus(input) {
        if (this.isIOS) {
            // Ensure proper font size to prevent zoom
            input.style.fontSize = '16px';
            
            // Scroll input into view with better positioning
            setTimeout(() => {
                this.scrollInputIntoView(input);
            }, 100);
        }
        
        if (this.isMac) {
            // Add enhanced focus styling
            input.classList.add('mac-focused');
        }
        
        // Add universal focus class
        input.classList.add('input-focused');
    }
    
    /**
     * Handle input blur
     */
    handleInputBlur(input) {
        input.classList.remove('input-focused', 'mac-focused', 'ios-focused');
        
        if (this.isIOS) {
            // Restore scroll position
            this.restoreScrollPosition();
        }
    }
    
    /**
     * Handle input value changes
     */
    handleInputChange(e) {
        const input = e.target;
        
        // Validate input if needed
        this.validateInput(input);
        
        // Trigger custom events
        this.dispatchCustomEvent('inputchange', {
            input: input,
            value: input.value,
            platform: this.getPlatform()
        });
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        const input = e.target;
        
        // Handle Enter key
        if (e.key === 'Enter') {
            this.handleEnterKey(e, input);
        }
        
        // Handle Escape key
        if (e.key === 'Escape') {
            this.handleEscapeKey(e, input);
        }
        
        // Platform-specific key handling
        if (this.isIOS) {
            this.handleIOSKeyDown(e, input);
        }
        
        if (this.isMac) {
            this.handleMacKeyDown(e, input);
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        const input = e.target;
        
        // Update input state
        this.updateInputState(input);
    }
    
    /**
     * Handle Enter key press
     */
    handleEnterKey(e, input) {
        e.preventDefault();
        
        // Trigger confirm action
        this.dispatchCustomEvent('inputconfirm', {
            input: input,
            value: input.value,
            platform: this.getPlatform()
        });
    }
    
    /**
     * Handle Escape key press
     */
    handleEscapeKey(e, input) {
        e.preventDefault();
        
        // Trigger cancel action
        this.dispatchCustomEvent('inputcancel', {
            input: input,
            platform: this.getPlatform()
        });
    }
    
    /**
     * iOS specific keyboard handling
     */
    handleIOSKeyboard() {
        const activeInput = this.getActiveInput();
        if (activeInput) {
            setTimeout(() => {
                this.scrollInputIntoView(activeInput);
            }, 100);
        }
    }
    
    /**
     * Handle visual viewport changes (iOS 13+)
     */
    handleVisualViewportChange() {
        const activeInput = this.getActiveInput();
        if (activeInput && window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const keyboardHeight = windowHeight - viewportHeight;
            
            if (keyboardHeight > 0) {
                this.adjustForKeyboard(activeInput, keyboardHeight);
            }
        }
    }
    
    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        // Reset viewport
        if (this.viewport) {
            this.viewport.content = this.originalViewport;
        }
        
        // Reposition active input
        const activeInput = this.getActiveInput();
        if (activeInput) {
            setTimeout(() => {
                this.scrollInputIntoView(activeInput);
            }, 200);
        }
    }
    
    /**
     * Scroll input into view
     */
    scrollInputIntoView(input) {
        if (!input) return;
        
        const rect = input.getBoundingClientRect();
        const viewportHeight = window.visualViewport ? 
            window.visualViewport.height : window.innerHeight;
        
        // Calculate optimal scroll position
        const targetY = rect.top + window.pageYOffset - (viewportHeight * 0.3);
        
        window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
        });
    }
    
    /**
     * Adjust layout for keyboard
     */
    adjustForKeyboard(input, keyboardHeight) {
        const rect = input.getBoundingClientRect();
        const availableHeight = window.innerHeight - keyboardHeight;
        
        if (rect.bottom > availableHeight) {
            const scrollOffset = rect.bottom - availableHeight + 20;
            window.scrollBy(0, scrollOffset);
        }
    }
    
    /**
     * Disable viewport zoom
     */
    disableViewportZoom() {
        if (this.viewport) {
            this.viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
    }
    
    /**
     * Restore viewport zoom
     */
    restoreViewportZoom() {
        if (this.viewport) {
            setTimeout(() => {
                this.viewport.content = this.originalViewport;
            }, 500);
        }
    }
    
    /**
     * Validate input
     */
    validateInput(input) {
        const value = input.value;
        const type = input.type;
        
        if (type === 'tel' || input.inputMode === 'numeric') {
            // Only allow numbers for numeric inputs
            const numericValue = value.replace(/[^0-9.-]/g, '');
            if (value !== numericValue) {
                input.value = numericValue;
            }
        }
    }
    
    /**
     * Update input state
     */
    updateInputState(input) {
        // Add state classes
        if (input.value.trim()) {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    }
    
    /**
     * Get current platform
     */
    getPlatform() {
        if (this.isIOS) return 'ios';
        if (this.isMac) return 'mac';
        return 'other';
    }
    
    /**
     * Dispatch custom events
     */
    dispatchCustomEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Mac-specific keyboard shortcuts
     */
    handleMacKeyboardShortcuts(e) {
        // Cmd+A - Select all
        if (e.key === 'a') {
            e.target.select();
        }
    }
    
    /**
     * iOS-specific key handling
     */
    handleIOSKeyDown(e, input) {
        // Handle done button on iOS numeric keyboard
        if (e.key === 'Enter' && input.type === 'tel') {
            input.blur();
        }
    }
    
    /**
     * Mac-specific key handling
     */
    handleMacKeyDown(e, input) {
        // Enhanced Mac keyboard behavior
        if (e.metaKey && e.key === 'Backspace') {
            // Cmd+Backspace - Clear all
            e.preventDefault();
            input.value = '';
            this.handleInputChange({ target: input });
        }
    }
    
    /**
     * Restore scroll position
     */
    restoreScrollPosition() {
        // Smooth scroll to top or saved position
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    /**
     * Public API - Create input with optimizations
     */
    createOptimizedInput(type = 'text', placeholder = '') {
        const input = document.createElement('input');
        input.type = this.isIOS && type === 'number' ? 'tel' : type;
        input.placeholder = placeholder;
        
        // Apply platform-specific attributes
        if (this.isIOS) {
            input.style.fontSize = '16px';
            input.autocomplete = 'off';
            input.autocorrect = 'off';
            input.autocapitalize = 'off';
            input.spellcheck = false;
        }
        
        if (this.isMac) {
            input.style.fontFamily = "'SF Pro Text', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
        }
        
        return input;
    }
    
    /**
     * Public API - Focus input with optimizations
     */
    focusInput(input) {
        if (!this.isInputElement(input)) return;
        
        if (this.isIOS) {
            // Delay focus on iOS to prevent layout issues
            setTimeout(() => {
                input.focus();
            }, 100);
        } else {
            input.focus();
        }
    }
    
    /**
     * Public API - Blur input with cleanup
     */
    blurInput(input) {
        if (!this.isInputElement(input)) return;
        
        input.blur();
        this.handleInputBlur(input);
    }
}

// Export for use in other modules
window.InputHandler = InputHandler;

// Auto-initialize if document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.inputHandler = new InputHandler();
    });
} else {
    window.inputHandler = new InputHandler();
}
