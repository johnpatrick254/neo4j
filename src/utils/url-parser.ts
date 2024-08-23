// Function to convert a string to a URL-friendly format
export function toUrlFriendly(str) {
    return str
        .replace(/ /g, '%20')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C')
        .replace(/\?/g, '%3F')
        .replace(/=/g, '%3D')
        .replace(/&/g, '%26')
        .replace(/\//g, '%2F')
        .replace(/\+/g, '%2B');
}

// Function to convert a URL-friendly string back to its original form
export function fromUrlFriendly(str) {
    return str
        .replace(/%20/g, ' ')
        .replace(/%3A/g, ':')
        .replace(/%2C/g, ',')
        .replace(/%3F/g, '?')
        .replace(/%3D/g, '=')
        .replace(/%26/g, '&')
        .replace(/%2F/g, '/')
        .replace(/%2B/g, '+');
}
