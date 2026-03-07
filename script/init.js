!function (o, c) {
    var n = c.documentElement,
        t = " w-mod-";
    n.className += t + "js",
    ("ontouchstart" in o || o.DocumentTouch && c instanceof DocumentTouch) && (n.className += t + "touch")
}(window, document);

WebFont.load({
    google: {
        families: ["Bricolage Grotesque:300,400,500,600,700", "Manrope:300,400,500,600,700"]
    }
});
