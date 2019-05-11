function (keys, values, rereduce) {
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
      })(),
      'positive_count': values.reduce(function(a, b) { return a + b.positive_count }, 0),
      'negative_count': values.reduce(function(a, b) { return a + b.negative_count }, 0),
      'positive_mean': (function(){
        var count = 0;
        var sum = 0
        values.forEach(function (value) {
          count += value.positive_count;
          sum += value.positive_mean;
        });
        if (count == 0) {
          return 0;
        } else {
          return sum/count;
        }
      })(),
      'negative_mean': (function(){
        var count = 0;
        var sum = 0
        values.forEach(function (value) {
          count += value.negative_count;
          sum += value.negative_mean;
        });
        if (count == 0) {
          return 0;
        } else {
          return sum/count;
        }
      })(),
      'geo_coordinates':values.reduce(function(a, b) { return b.geo_coordinates }, 0),
      'suburb':values.reduce(function(a, b) { return b.suburb }, 0)
    }
  } else {
    return {
      'sum': (function(){
          var result = 0;
          values.forEach(function (vObj) {
            result += vObj.polarity;
          });
          return result;
      })(),
      'count': values.length,
      'min': (function(){
          var result = 0;
          values.forEach(function (vObj) {
            result = Math.min(result, vObj.polarity);
          });
          return result;
      })(),
      'max': (function(){
          var result = 0;
          values.forEach(function (vObj) {
            result = Math.max(result, vObj.polarity);
          });
          return result;
      })(),
      'mean': (function(){
          var result = 0;
          if (values.length == 0) {
              return 0;
          } else {
            values.forEach(function (vObj) {
              result += vObj.polarity;
            });
              return result/values.length;
          }
      })(),
      'positive_count': (function(){
          var count = 0;
          values.forEach(function (vObj) {
              if ( vObj.polarity >= 0.0 ){
                count += 1;
              }
          });
          return count;
      })(),
      'negative_count': (function(){
          var count = 0;
          values.forEach(function (vObj) {
              if ( vObj.polarity < 0.0 ){
                count += 1;
              }
          });
          return count;
      })(),
      'positive_mean': (function(){
          var count = 0;
          var sum = 0;
          values.forEach(function (vObj) {
              if ( vObj.polarity >= 0.0 ){
                count += 1;
                sum += vObj.polarity;
              }
          });
          if (count == 0){
            return 0;
          } else {
            return sum/count;
          }
      })(),
      'negative_mean': (function(){
          var count = 0;
          var sum = 0;
          values.forEach(function (vObj) {
              if ( vObj.polarity < 0.0 ){
                count += 1;
                sum += vObj.polarity;
              }
          });
          if (count == 0){
            return 0;
          } else {
            return sum/count;
          }
      })(),
      'geo_coordinates': (function(){
        return values[values.length -1].geo_coordinates;
      })(),
      'suburb': (function(){
        return values[values.length -1].suburb;
      })(),
    }
  }
}
