/**
 * Created by Alex Bol on 2/20/2017.
 */
"use strict";

import Flatten from '../flatten';
import * as Intersection from '../algorithms/intersection';

/**
 * Class representing a line
 * @type {Line}
 */
export class Line {
    /**
     * Line may be constructed by point and normal vector or by two points that a line passes through
     * @param {Point} pt - point that a line passes through
     * @param {Vector|Point} norm - normal vector to a line or second point a line passes through
     */
    constructor(...args) {
        /**
         * Point a line passes through
         * @type {Point}
         */
        this.pt = new Flatten.Point();
        /**
         * Normal vector to a line <br/>
         * Vector is normalized (length == 1)
         * @type {Vector}
         */
        this.norm = new Flatten.Vector(0, 1);

        if (args.length == 0) {
            return;
        }

        if (args.length == 1 && args[0] instanceof Object && args[0].name === "line") {
            let {pt, norm} = args[0];
            this.pt = new Flatten.Point(pt);
            this.norm = new Flatten.Vector(norm);
            return;
        }

        if (args.length == 2) {
            let a1 = args[0];
            let a2 = args[1];

            if (a1 instanceof Flatten.Point && a2 instanceof Flatten.Point) {
                this.pt = a1;
                this.norm = Line.points2norm(a1, a2);
                return;
            }

            if (a1 instanceof Flatten.Point && a2 instanceof Flatten.Vector) {
                if (Flatten.Utils.EQ_0(a2.x) && Flatten.Utils.EQ_0(a2.y)) {
                    throw Flatten.Errors.ILLEGAL_PARAMETERS;
                }
                this.pt = a1.clone();
                this.norm = a2.clone();
                this.norm = this.norm.normalize();
                return;
            }

            if (a1 instanceof Flatten.Vector && a2 instanceof Flatten.Point) {
                if (Flatten.Utils.EQ_0(a1.x) && Flatten.Utils.EQ_0(a1.y)) {
                    throw Flatten.Errors.ILLEGAL_PARAMETERS;
                }
                this.pt = a2.clone();
                this.norm = a1.clone();
                this.norm = this.norm.normalize();
                return;
            }
        }

        throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }

    /**
     * Returns cloned new instance of a line
     * @returns {Line}
     */
    clone() {
        return new Flatten.Line(this.pt, this.norm);
    }

    /**
     * Slope of the line - angle in radians between line and axe x from 0 to 2PI
     * @returns {number} - slope of the line
     */
    get slope() {
        let vec = new Flatten.Vector(this.norm.y, -this.norm.x);
        return vec.slope;
    }

    /**
     * Get coefficients [A,B,C] of a standard line equation in the form Ax + By = C
     * @code [A, B, C] = line.standard
     * @returns {number[]} - array of coefficients
     */
    get standard() {
        let A = this.norm.x;
        let B = this.norm.y;
        let C = this.norm.dot(this.pt);

        return [A, B, C];
    }

    /**
     * Return true if parallel or incident to other line
     * @param {Line} other_line - line to check
     * @returns {boolean}
     */
    parallelTo(other_line) {
        return Flatten.Utils.EQ_0(this.norm.cross(other_line.norm));
    }

    /**
     * Returns true if incident to other line
     * @param {Line} other_line - line to check
     * @returns {boolean}
     */
    incidentTo(other_line) {
        return this.parallelTo(other_line) && this.pt.on(other_line);
    }

    /**
     * Returns true if point belongs to line
     * @param {Point} pt Query point
     * @returns {boolean}
     */
    contains(pt) {
        if (this.pt.equalTo(pt)) {
            return true;
        }
        /* Line contains point if vector to point is orthogonal to the line normal vector */
        let vec = new Flatten.Vector(this.pt, pt);
        return Flatten.Utils.EQ_0(this.norm.dot(vec));
    }

    /**
     * Returns array of intersection points
     * @param {Shape} shape - shape to intersect with
     * @returns {Point[]}
     */
    intersect(shape) {
        if (shape instanceof Flatten.Point) {
            return this.contains(shape) ? [shape] : [];
        }

        if (shape instanceof Flatten.Line) {
            return Intersection.intersectLine2Line(this, shape);
        }

        if (shape instanceof Flatten.Circle) {
            return Intersection.intersectLine2Circle(this, shape);
        }

        if (shape instanceof Flatten.Segment) {
            return Intersection.intersectSegment2Line(shape, this);
        }

        if (shape instanceof Flatten.Arc) {
            return Intersection.intersectLine2Arc(this, shape);
        }

        if (shape instanceof Flatten.Polygon) {
            return  Intersection.intersectLine2Polygon(this, shape);
        }

    }

    /**
     * Calculate distance and shortest segment from line to shape and returns array [distance, shortest_segment]
     * @param {Shape} shape Shape of the one of the types Point, Circle, Segment, Arc, Polygon
     * @returns {Number}
     * @returns {Segment}
     */
    distanceTo(shape) {
        if (shape instanceof Flatten.Point) {
            let [distance, shortest_segment] = Flatten.Distance.point2line(shape, this);
            shortest_segment = shortest_segment.reverse();
            return [distance, shortest_segment];
        }

        if (shape instanceof Flatten.Circle) {
            let [distance, shortest_segment] = Flatten.Distance.circle2line(shape, this);
            shortest_segment = shortest_segment.reverse();
            return [distance, shortest_segment];
        }

        if (shape instanceof Flatten.Segment) {
            let [distance, shortest_segment] = Flatten.Distance.segment2line(shape, this);
            return [distance, shortest_segment.reverse()];
        }

        if (shape instanceof Flatten.Arc) {
            let [distance, shortest_segment] = Flatten.Distance.arc2line(shape, this);
            return [distance, shortest_segment.reverse()];
        }

        if (shape instanceof Flatten.Polygon) {
            let [distance, shortest_segment] = Flatten.Distance.shape2polygon(this, shape);
            return [distance, shortest_segment];
        }
    }

    /**
     * Return string to draw svg segment representing line inside given box
     * @param {Box} box Box representing drawing area
     * @param {Object} attrs - an object with attributes of svg circle element
     */
    svg(box, attrs = {}) {
        let ip = Intersection.intersectLine2Box(this, box);
        if (ip.length === 0)
            return "";
        let ps = ip[0];
        let pe = ip.length == 2 ? ip[1] : ip.find(pt => !pt.equalTo(ps));
        if (pe === undefined) pe = ps;
        let segment = new Flatten.Segment(ps, pe);
        return segment.svg(attrs);
    }

    /**
     * This method returns an object that defines how data will be
     * serialized when called JSON.stringify() method
     * @returns {Object}
     */
    toJSON() {
        return Object.assign({}, this, {name: "line"});
    }

    static points2norm(pt1, pt2) {
        if (pt1.equalTo(pt2)) {
            throw Flatten.Errors.ILLEGAL_PARAMETERS;
        }
        let vec = new Flatten.Vector(pt1, pt2);
        let unit = vec.normalize();
        return unit.rotate90CCW();
    }
};

Flatten.Line = Line;
/**
 * Function to create line equivalent to "new" constructor
 * @param args
 */
export const line = (...args) => new Flatten.Line(...args);
Flatten.line = line;
