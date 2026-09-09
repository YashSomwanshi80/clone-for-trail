package com.amigos.backend.common;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

public final class GeoUtils {

    // 4326 = WGS84, the standard lat/lng coordinate system (GPS/Google Maps)
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private GeoUtils() {}

    public static Point toPoint(double lat, double lng) {
        // JTS coordinates are (x=lng, y=lat) — reversed from how "lat, lng" is normally said
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }

    public static double getLat(Point point) {
        return point.getY();
    }

    public static double getLng(Point point) {
        return point.getX();
    }
}
