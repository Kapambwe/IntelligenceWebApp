// Helper functions for IntelligenceWebApp

/**
 * Downloads a file from base64 encoded data
 * @param {string} filename - The name of the file to download
 * @param {string} contentType - The MIME type of the file
 * @param {string} base64Data - The base64 encoded file data
 */
window.downloadFileFromBase64 = function (filename, contentType, base64Data) {
    try {
        // Convert base64 to binary
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob
        const blob = new Blob([bytes], { type: contentType });

        // Create download link
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        console.log(`File downloaded successfully: ${filename}`);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
};

/**
 * Downloads a file from a URL
 * @param {string} filename - The name of the file to download
 * @param {string} url - The URL to download from
 */
window.downloadFileFromUrl = function (filename, url) {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`File download initiated: ${filename}`);
    } catch (error) {
        console.error('Error downloading file from URL:', error);
        throw error;
    }
};

/**
 * Opens a URL in a new tab
 * @param {string} url - The URL to open
 */
window.openInNewTab = function (url) {
    window.open(url, '_blank');
};

/**
 * Copies text to clipboard
 * @param {string} text - The text to copy
 */
window.copyToClipboard = async function (text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard');
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                console.log('Text copied to clipboard (fallback)');
                return true;
            } catch (error) {
                console.error('Failed to copy text:', error);
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
};

/**
 * Prints the current page
 */
window.printPage = function () {
    window.print();
};

/**
 * Scrolls to an element by ID
 * @param {string} elementId - The ID of the element to scroll to
 */
window.scrollToElement = function (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

console.log('Helper functions loaded successfully');
