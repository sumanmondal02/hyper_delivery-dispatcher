export const isVendorOpenNow = (vendor)=>{
    if(!vendor.isOpen) return false;
    const now = new Date();
    const current = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    return (
    current >= vendor.openingTime &&
    current <= vendor.closingTime
    );
};