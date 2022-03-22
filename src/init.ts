try {
    !document && (document = undefined);
    !window && (window = undefined);
} catch (err) {
    document = undefined;
    window = undefined;
} finally {
    !window ? console.log("Susuru.js - Server") : console.log("Susuru.js - Client")
}
