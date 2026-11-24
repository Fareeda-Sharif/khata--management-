// Keeps CNIC, phone numbers and dates in the correct order inside right-to-left (Urdu) pages
export const Ltr = ({ children }) => <bdi dir="ltr">{children}</bdi>;
