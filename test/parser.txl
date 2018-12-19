struct Point {
    double x = 1.345;
    double y;
}

fn createPoint(double x, double y): Point {
    return {
        .x = x,
        .y = y,
    };
}

fn main(): void {
    Point point = createPoint(3, 4);
    double x = createPoint(3, 4).x;

    double y = point.y;

    boolean bool = true;
    double thing = 1 + 2.45;
    loop (bool) {
        bool = !bool;
    }

    if (point.x == 1) {
        point.x = 5;
//        point = {
//            .x = 5,
//            .y = 6,
//        };
    } else if (point.y == 2) {
        point.y = 8;
//        point = {
//            .x = 7,
//            .y = 8,
//        };
    }
}
