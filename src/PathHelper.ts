
class PathHelper {
    
    static tracePathItem(path: paper.PathItem, pointsPerPath: number): paper.PathItem {
        if(path.className === 'CompoundPath'){
            return this.traceCompoundPath(<paper.CompoundPath>path, pointsPerPath);
        } else {
            return this.tracePath(<paper.Path>path, pointsPerPath);
        }
    }
    
    static traceCompoundPath(path: paper.CompoundPath, pointsPerPath: number): paper.CompoundPath {
        if(!path.children.length){
            return null;
        }
        let paths = path.children.map(p => 
            this.tracePath(<paper.Path>p, pointsPerPath));
        return new paper.CompoundPath({
            children: paths,
            clockwise: path.clockwise,
            fillColor: 'lightgray'
        })
    }
   
    static tracePath(path: paper.Path, numPoints: number): paper.Path {
        // if(!path || !path.segments || path.segments.length){
        //     return new paper.Path();
        // }
        let pathLength = path.length;
        let offsetIncr = pathLength / numPoints;
        let points = [];
        //points.length = numPoints;
        let i = 0;
        let offset = 0;
        
        while(i++ < numPoints){
            let point = path.getPointAt(Math.min(offset, pathLength));
            points.push(point);
            offset += offsetIncr;
        }
        
        var path = new paper.Path(points);
        return path;
    }
    
}