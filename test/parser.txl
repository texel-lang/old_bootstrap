enum Direction {
    NORTH,
    EAST,
    SOUTH,
    WEST
}

struct Vector {
    Direction direction;
    double x;
    double y;
}

fn Direction.opposite(): Direction {
    when (this) {
        NORTH :: {
            return Direction.SOUTH;
        },
        EAST :: {
            return Direction.WEST;
        },
        SOUTH :: {
            return Direction.NORTH;
        },
        WEST :: {
            return Direction.EAST;
        },

    }
}

fn main(): void {
    Direction dir = Direction.WEST;
    Direction oppositeDir = dir.opposite();

    if (oppositeDir == Direction.WEST) {
        // should never happen....
        println("Oops...");
    } else {
        println("Neat...");
    }

    Vector v = {
        .dir,
        .x = 4.5,
        .y = 2.3,
    };

    console.log(v.dir.opposite());
}
