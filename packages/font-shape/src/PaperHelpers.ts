import paper from 'paper'
import { Curvelike } from './Curvelike'

export const SAFARI_MAX_CANVAS_AREA = 67108864

/**
 * Determine the max dpi that can supported by Canvas.
 * Using Safari as the measure, because it seems to have the smallest limit.
 * Max DPI in Chrome produces approx 8000x8000.
 */
export function getMaxExportDpi(itemSize: paper.Size) {
  return getExportDpi(itemSize, SAFARI_MAX_CANVAS_AREA)
}

export function getExportDpi(itemSize: paper.Size, pixels: number) {
  const itemArea = itemSize.width * itemSize.height
  return 0.999 * Math.sqrt(pixels)
    * (paper.view.resolution)
    / Math.sqrt(itemArea)
}

export const importOpenTypePath = function (openPath: opentypejs.Path): paper.CompoundPath {
  return new paper.CompoundPath(openPath.toPathData(6))
}

export const tracePathItem = function (path: paper.PathItem, pointsPerPath: number): paper.PathItem {
  if (path.className === 'CompoundPath') {
    return this.traceCompoundPath(path as paper.CompoundPath, pointsPerPath)
  } else {
    return this.tracePath(path as paper.Path, pointsPerPath)
  }
}

export const traceCompoundPath = function (path: paper.CompoundPath, pointsPerPath: number): paper.CompoundPath {
  if (!path.children.length) {
    return null
  }
  let paths = path.children.map(p =>
    this.tracePath(p, pointsPerPath))
  return new paper.CompoundPath({
    children: paths,
    clockwise: path.clockwise,
  })
}

export const tracePathAsPoints = function (path: paper.Path, numPoints: number): paper.Point[] {
  let pathLength = path.length
  let offsetIncr = pathLength / numPoints
  let points = []
  let i = 0
  let offset = 0

  while (i++ < numPoints) {
    let point = path.getPointAt(Math.min(offset, pathLength))
    points.push(point)
    offset += offsetIncr
  }

  return points
}

export const tracePath = function (path: paper.Path, numPoints: number): paper.Path {
  let points = tracePathAsPoints(path, numPoints)
  return new paper.Path({
    segments: points,
    closed: true,
    clockwise: path.clockwise,
  })
}

export const dualBoundsPathProjection = function (topPath: Curvelike, bottomPath: Curvelike)
  : (unitPoint: paper.Point) => paper.Point {
  const topPathLength = topPath.length
  const bottomPathLength = bottomPath.length
  return function (unitPoint: paper.Point): paper.Point {
    let topPoint = topPath.getPointAt(unitPoint.x * topPathLength)
    let bottomPoint = bottomPath.getPointAt(unitPoint.x * bottomPathLength)
    if (topPoint == null || bottomPoint == null) {
      console.warn('could not get projected point for unit point ' + unitPoint)
      return topPoint
    } else {
      return topPoint.add(bottomPoint.subtract(topPoint).multiply(unitPoint.y))
    }
  }
}

export let markerGroup: paper.Group

export const resetMarkers = function () {
  if (markerGroup) {
    markerGroup.remove()
  }
  markerGroup = new paper.Group()
  markerGroup.opacity = 0.2

}

export const markerLine = function (a: paper.Point, b: paper.Point): paper.Item {
  let line = new paper.Path.Line(a, b)
  line.strokeColor = new paper.Color('green')
  //line.dashArray = [5, 5];
  markerGroup.addChild(line)
  return line
}

export const marker = function (point: paper.Point, label: string): paper.Item {
  let marker = new paper.PointText(point)
  marker.fontSize = 36
  marker.content = label
  marker.strokeColor = new paper.Color('red')
  marker.bringToFront()
  return marker
}

export const simplify = function (path: paper.PathItem, tolerance?: number) {
  if (path.className === 'CompoundPath') {
    for (let p of path.children) {
      simplify(p as paper.PathItem, tolerance)
    }
  } else {
    path.simplify(tolerance)
  }
}

/**
 * Find self or nearest ancestor satisfying the predicate.
 */
export const findSelfOrAncestor = function (item: paper.Item, predicate: (i: paper.Item) => boolean) {
  if (predicate(item)) {
    return item
  }
  return findAncestor(item, predicate)
}

/**
 * Find nearest ancestor satisfying the predicate.
 */
export const findAncestor = function (item: paper.Item, predicate: (i: paper.Item) => boolean) {
  if (!item) {
    return null
  }
  let prior: paper.Item = null
  let checking = item.parent
  while (checking && checking !== prior) {
    if (predicate(checking)) {
      return checking
    }
    prior = checking
    checking = checking.parent
  }
  return null
}

/**
 * The corners of the rect, clockwise starting from topLeft
 */
export const corners = function (rect: paper.Rectangle): paper.Point[] {
  return [rect.topLeft, rect.topRight, rect.bottomRight, rect.bottomLeft]
}

/**
 * the midpoint between two points
 */
export const midpoint = function (a: paper.Point, b: paper.Point) {
  return b.subtract(a).divide(2).add(a)
}

export const cloneSegment = function (segment: paper.Segment) {
  return new paper.Segment(segment.point, segment.handleIn, segment.handleOut)
}

/**
 * Returns a - b, where a and b are unit offsets along a closed path.
 */
export function pathOffsetLength(start: number, end: number, clockwise: boolean = true) {
  start = pathOffsetNormalize(start)
  end = pathOffsetNormalize(end)
  if (clockwise) {
    if (start > end) {
      end += 1
    }
    return pathOffsetNormalize(end - start)
  }
  if (end > start) {
    start += 1
  }
  return pathOffsetNormalize(start - end)
}

export function pathOffsetNormalize(offset: number) {
  if (offset < 0) {
    offset += Math.round(offset) + 1
  }
  return offset % 1
}
