using RadioPlanner.Models;

namespace RadioPlanner.Services;

public static class GeoService
{
    private const double EarthRadiusKm = 6371.0;

    /// <summary>Haversine distance between two WGS84 points, returns km.</summary>
    public static double HaversineKm(LatLng a, LatLng b)
    {
        var dLat = ToRad(b.Lat - a.Lat);
        var dLng = ToRad(b.Lng - a.Lng);
        var sinDLat = Math.Sin(dLat / 2);
        var sinDLng = Math.Sin(dLng / 2);
        var h = sinDLat * sinDLat
              + Math.Cos(ToRad(a.Lat)) * Math.Cos(ToRad(b.Lat)) * sinDLng * sinDLng;
        return 2 * EarthRadiusKm * Math.Asin(Math.Sqrt(h));
    }

    /// <summary>Bearing from a → b in degrees (0=N, 90=E).</summary>
    public static double BearingDeg(LatLng a, LatLng b)
    {
        var dLng = ToRad(b.Lng - a.Lng);
        var lat1 = ToRad(a.Lat);
        var lat2 = ToRad(b.Lat);
        var y = Math.Sin(dLng) * Math.Cos(lat2);
        var x = Math.Cos(lat1) * Math.Sin(lat2) - Math.Sin(lat1) * Math.Cos(lat2) * Math.Cos(dLng);
        return (Math.Atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    /// <summary>Format a LatLng as a human-readable string.</summary>
    public static string FormatLatLng(LatLng pos, int decimals = 5)
    {
        var lat = pos.Lat >= 0
            ? $"{pos.Lat.ToString($"F{decimals}")}°N"
            : $"{Math.Abs(pos.Lat).ToString($"F{decimals}")}°S";
        var lng = pos.Lng >= 0
            ? $"{pos.Lng.ToString($"F{decimals}")}°E"
            : $"{Math.Abs(pos.Lng).ToString($"F{decimals}")}°W";
        return $"{lat}, {lng}";
    }

    /// <summary>Mid-point between two positions.</summary>
    public static LatLng MidPoint(LatLng a, LatLng b) =>
        new((a.Lat + b.Lat) / 2, (a.Lng + b.Lng) / 2);

    /// <summary>Generate a point at given bearing (deg) and distance (km) from origin.</summary>
    public static LatLng DestPoint(LatLng origin, double bearingDeg, double distKm)
    {
        var delta = distKm / EarthRadiusKm;
        var theta = ToRad(bearingDeg);
        var phi1 = ToRad(origin.Lat);
        var lambda1 = ToRad(origin.Lng);
        var phi2 = Math.Asin(Math.Sin(phi1) * Math.Cos(delta)
                           + Math.Cos(phi1) * Math.Sin(delta) * Math.Cos(theta));
        var lambda2 = lambda1 + Math.Atan2(
            Math.Sin(theta) * Math.Sin(delta) * Math.Cos(phi1),
            Math.Cos(delta) - Math.Sin(phi1) * Math.Sin(phi2));
        return new(phi2 * 180 / Math.PI, lambda2 * 180 / Math.PI);
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
