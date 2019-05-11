function(keys, values, rereduce) {
    if (rereduce) {
        return {
            'sum': values.reduce(function(a, b) { return a + b.sum }, 0),
            'count': values.reduce(function(a, b) { return a + b.count }, 0),
            'min': values.reduce(function(a, b) { return Math.min(a, b.min) }, Infinity),
            'max': values.reduce(function(a, b) { return Math.max(a, b.max) }, -Infinity),
            'mean': (function(){
              var count = 0;
              var sum = 0
              values.forEach(function (value) {
                count += value.count;
                sum += value.sum;
              });
              if (count == 0) {
                return 0;
              } else {
                return sum/count;
              }
            })()
        }
    } else {
        return {
            'sum': sum(values),
            'count': values.length,
            'min': Math.min(Math.min.apply(Math, values), 0),
            'max': Math.max(Math.max.apply(Math, values), 0),
            'mean': (function(){
                if (values.length == 0) {
                    return 0
                } else {
                    return sum(values)/values.length
                }
            })()
        }
    }
}
