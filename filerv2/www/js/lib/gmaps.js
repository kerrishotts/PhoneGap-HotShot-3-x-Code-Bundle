/**
 * This encapsulates the long async!http://... google maps API string so that it's easier to require
 *
 * Based on http://blog.millermedeiros.com/requirejs-2-0-delayed-module-evaluation-and-google-maps/
 */
define ( ['async!http://maps.google.com/maps/api/js?v=3&sensor=true'],
function()
{
    return window.google.maps;
});
