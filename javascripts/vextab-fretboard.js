var slice = [].slice,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Vex.Flow.Fretboard = (function() {
  var L, error;

  Fretboard.DEBUG = false;

  L = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (Vex.Flow.Fretboard.DEBUG) {
      return typeof console !== "undefined" && console !== null ? console.log.apply(console, ["(Vex.Flow.Fretboard)"].concat(slice.call(args))) : void 0;
    }
  };

  function Fretboard(paper1, options) {
    this.paper = paper1;
    L("constructor: options=", options);
    this.options = {
      strings: 6,
      start_fret: 1,
      end_fret: 22,
      tuning: "standard",
      color: "black",
      marker_color: "#aaa",
      x: 10,
      y: 20,
      width: this.paper.view.size.width - 20,
      height: this.paper.view.size.height - 40,
      marker_radius: 4,
      font_face: "Arial",
      font_size: 12,
      font_color: "black",
      nut_color: "#aaa",
      start_fret_text: null
    };
    _.extend(this.options, options);
    this.reset();
  }

  error = function(msg) {
    return new Vex.RERR("FretboardError", msg);
  };

  Fretboard.prototype.reset = function() {
    L("reset()");
    if (this.options.strings < 2) {
      throw error("Too few strings: " + this.options.strings);
    }
    if ((this.options.end_fret - this.options.start_fret) < 3) {
      throw error("Too few frets: " + this.options.end_fret);
    }
    this.x = this.options.x;
    this.y = this.options.y;
    this.width = this.options.width;
    this.nut_width = 10;
    this.start_fret = parseInt(this.options.start_fret, 10);
    this.end_fret = parseInt(this.options.end_fret, 10);
    this.total_frets = this.end_fret - this.start_fret;
    if (this.end_fret <= this.start_fret) {
      throw error("Start fret number must be lower than end fret number: " + this.start_fret + " >= " + this.end_fret);
    }
    this.start_fret_text = this.options.start_fret_text != null ? this.options.start_fret_text : this.start_fret;
    this.height = this.options.height - (this.start_fret === 0 ? 0 : 10);
    this.string_spacing = this.height / (this.options.strings - 1);
    this.fret_spacing = (this.width - this.nut_width) / (this.total_frets - 1);
    this.light_radius = (this.string_spacing / 2) - 1;
    return this.calculateFretPositions();
  };

  Fretboard.prototype.calculateFretPositions = function() {
    var i, k, num, ref, transform, width, x;
    L("calculateFretPositions: width=" + this.width);
    width = this.width - this.nut_width;
    this.bridge_to_fret = [width];
    this.fretXs = [0];
    k = 1.05946;
    for (num = i = 1, ref = this.total_frets; 1 <= ref ? i <= ref : i >= ref; num = 1 <= ref ? ++i : --i) {
      this.bridge_to_fret[num] = width / Math.pow(k, num);
      this.fretXs[num] = width - this.bridge_to_fret[num];
    }
    transform = (function(_this) {
      return function(x) {
        return (x / _this.fretXs[_this.total_frets]) * width;
      };
    })(this);
    return this.fretXs = (function() {
      var j, len, ref1, results;
      ref1 = this.fretXs;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        x = ref1[j];
        results.push(transform(x));
      }
      return results;
    }).call(this);
  };

  Fretboard.prototype.hasFret = function(num) {
    var i, ref, ref1, results;
    return indexOf.call((function() {
      results = [];
      for (var i = ref = this.start_fret - 1, ref1 = this.end_fret; ref <= ref1 ? i <= ref1 : i >= ref1; ref <= ref1 ? i++ : i--){ results.push(i); }
      return results;
    }).apply(this), num) >= 0;
  };

  Fretboard.prototype.hasString = function(num) {
    var i, ref, results;
    return indexOf.call((function() {
      results = [];
      for (var i = 1, ref = this.options.strings; 1 <= ref ? i <= ref : i >= ref; 1 <= ref ? i++ : i--){ results.push(i); }
      return results;
    }).apply(this), num) >= 0;
  };

  Fretboard.prototype.getFretX = function(num) {
    return this.fretXs[num - (this.start_fret - 1)] + (this.start_fret > 1 ? 3 : this.nut_width);
  };

  Fretboard.prototype.getStringY = function(num) {
    return this.y + ((num - 1) * this.string_spacing);
  };

  Fretboard.prototype.getFretCenter = function(fret, string) {
    var end_fret, start_fret, x, y;
    start_fret = this.options.start_fret;
    end_fret = this.options.end_fret;
    if (!this.hasFret(fret)) {
      throw error("Invalid fret: " + fret);
    }
    if (!this.hasString(string)) {
      throw error("Invalid string: " + string);
    }
    x = 0;
    if (fret === 0) {
      x = this.getFretX(0) + (this.nut_width / 2);
    } else {
      x = (this.getFretX(fret) + this.getFretX(fret - 1)) / 2;
    }
    y = this.getStringY(string);
    return new this.paper.Point(x, y);
  };

  Fretboard.prototype.drawNut = function() {
    var path;
    L("drawNut()");
    path = new this.paper.Path.RoundRectangle(this.x, this.y - 5, this.nut_width, this.height + 10);
    path.strokeColor = this.options.nut_color;
    return path.fillColor = this.options.nut_color;
  };

  Fretboard.prototype.showStartFret = function() {
    var center;
    L("showStartFret()");
    center = this.getFretCenter(this.start_fret, 1);
    L("Center: ", center);
    return this.renderText(new this.paper.Point(center.x, this.y + this.height + 20), this.start_fret_text);
  };

  Fretboard.prototype.drawString = function(num) {
    var path, start, y;
    path = new this.paper.Path();
    path.strokeColor = this.options.color;
    y = this.getStringY(num);
    start = new this.paper.Point(this.x, y);
    path.moveTo(start);
    return path.lineTo(start.add([this.width, 0]));
  };

  Fretboard.prototype.drawFret = function(num) {
    var path, start, x;
    path = new this.paper.Path();
    path.strokeColor = this.options.color;
    x = this.getFretX(num);
    start = new this.paper.Point(x, this.y);
    path.moveTo(start);
    return path.lineTo(start.add([0, this.height]));
  };

  Fretboard.prototype.drawDot = function(x, y, color, radius) {
    var path;
    if (color == null) {
      color = 'red';
    }
    if (radius == null) {
      radius = 2;
    }
    path = new this.paper.Path.Circle(new this.paper.Point(x, y), radius);
    path.strokeColor = color;
    return path.fillColor = color;
  };

  Fretboard.prototype.drawMarkers = function() {
    var bottom_dot, drawCircle, i, j, len, len1, middle_dot, position, ref, ref1, results, start, top_dot, y_displacement;
    L("drawMarkers");
    middle_dot = 3;
    top_dot = 4;
    bottom_dot = 2;
    if (parseInt(this.options.strings, 10) === 4) {
      middle_dot = 2;
      top_dot = 3;
      bottom_dot = 1;
    }
    drawCircle = (function(_this) {
      return function(start) {
        var path;
        path = new _this.paper.Path.Circle(start, _this.options.marker_radius);
        path.strokeColor = _this.options.marker_color;
        return path.fillColor = _this.options.marker_color;
      };
    })(this);
    y_displacement = this.string_spacing / 2;
    ref = [3, 5, 7, 9, 15, 17, 19, 21];
    for (i = 0, len = ref.length; i < len; i++) {
      position = ref[i];
      if (this.hasFret(position)) {
        start = this.getFretCenter(position, middle_dot).add([0, y_displacement]);
        drawCircle(start);
      }
    }
    ref1 = [12, 24];
    results = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      position = ref1[j];
      if (this.hasFret(position)) {
        start = this.getFretCenter(position, bottom_dot).add([0, y_displacement]);
        drawCircle(start);
        start = this.getFretCenter(position, top_dot).add([0, y_displacement]);
        results.push(drawCircle(start));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Fretboard.prototype.renderText = function(point, value, color, size) {
    var text;
    if (color == null) {
      color = this.options.font_color;
    }
    if (size == null) {
      size = this.options.font_size;
    }
    text = new this.paper.PointText(point);
    text.justification = "center";
    text.characterStyle = {
      font: this.options.font_face,
      fontSize: size,
      fillColor: color
    };
    return text.content = value;
  };

  Fretboard.prototype.drawFretNumbers = function() {
    var fret, point, position, ref, results, value;
    ref = {
      5: "V",
      12: "XII",
      19: "XIX"
    };
    results = [];
    for (position in ref) {
      value = ref[position];
      fret = parseInt(position, 10);
      if (this.hasFret(fret)) {
        point = this.getFretCenter(fret, 6);
        point.y = this.getStringY(this.options.strings + 1);
        results.push(this.renderText(point, value));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Fretboard.prototype.lightText = function(options) {
    var opts, path, point, y_displacement;
    opts = {
      color: "white",
      fillColor: "#666"
    };
    _.extend(opts, options);
    L("lightUp: ", opts);
    point = this.getFretCenter(opts.fret, opts.string);
    path = new this.paper.Path.Circle(point, this.light_radius);
    path.strokeColor = opts.color;
    path.fillColor = opts.fillColor;
    y_displacement = this.string_spacing / 5;
    point.y += y_displacement;
    if (opts.text != null) {
      this.renderText(point, opts.text, opts.color);
    }
    return this.paper.view.draw();
  };

  Fretboard.prototype.lightUp = function(options) {
    var path, point;
    if (options.color == null) {
      options.color = '#666';
    }
    if (options.fillColor == null) {
      options.fillColor = options.color;
    }
    L("lightUp: ", options);
    point = this.getFretCenter(options.fret, options.string);
    path = new this.paper.Path.Circle(point, this.light_radius - 2);
    path.strokeColor = options.color;
    path.fillColor = options.fillColor;
    return this.paper.view.draw();
  };

  Fretboard.prototype.draw = function() {
    var i, j, num, ref, ref1, ref2;
    L("draw()");
    for (num = i = 1, ref = this.options.strings; 1 <= ref ? i <= ref : i >= ref; num = 1 <= ref ? ++i : --i) {
      this.drawString(num);
    }
    for (num = j = ref1 = this.start_fret, ref2 = this.end_fret; ref1 <= ref2 ? j <= ref2 : j >= ref2; num = ref1 <= ref2 ? ++j : --j) {
      this.drawFret(num);
    }
    if (this.start_fret === 1) {
      this.drawNut();
    } else {
      this.showStartFret();
    }
    this.drawMarkers();
    return this.paper.view.draw();
  };

  return Fretboard;

})();

Vex.Flow.FretboardDiv = (function() {
  var L, error, extractFrets, extractNotes, extractNumbers, genFretboardOptions;

  FretboardDiv.DEBUG = false;

  L = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (Vex.Flow.FretboardDiv.DEBUG) {
      return typeof console !== "undefined" && console !== null ? console.log.apply(console, ["(Vex.Flow.FretboardDiv)"].concat(slice.call(args))) : void 0;
    }
  };

  error = function(msg) {
    return new Vex.RERR("FretboardError", msg);
  };

  function FretboardDiv(sel, id) {
    this.sel = sel;
    this.id = id;
    this.options = {
      "width": 700,
      "height": 150,
      "strings": 6,
      "frets": 17,
      "start": 1,
      "start-text": null,
      "tuning": "standard"
    };
    if ((this.sel != null) && $(this.sel).length === 0) {
      throw error("Invalid selector: " + this.sel);
    }
    if (this.id == null) {
      this.id = $(this.sel).attr('id');
    }
    this.lights = [];
  }

  FretboardDiv.prototype.setOption = function(key, value) {
    if (indexOf.call(_.keys(this.options), key) >= 0) {
      L("Option: " + key + "=" + value);
      return this.options[key] = value;
    } else {
      throw error("Invalid option: " + key);
    }
  };

  genFretboardOptions = function(options) {
    var fboptions, k, v;
    fboptions = {};
    for (k in options) {
      v = options[k];
      switch (k) {
        case "width":
        case "height":
          continue;
        case "strings":
          fboptions.strings = v;
          break;
        case "frets":
          fboptions.end_fret = v;
          break;
        case "tuning":
          fboptions.tuning = v;
          break;
        case "start":
          fboptions.start_fret = v;
          break;
        case "start-text":
          fboptions.start_fret_text = v;
          break;
        default:
          throw error("Invalid option: " + k);
      }
    }
    return fboptions;
  };

  FretboardDiv.prototype.show = function(line) {
    var i, len, match, option, options, params, ref, valid_options;
    options = line.split(/\s+/);
    params = {};
    valid_options = ["fret", "frets", "string", "strings", "text", "color", "note", "notes", "fill-color"];
    for (i = 0, len = options.length; i < len; i++) {
      option = options[i];
      match = option.match(/^(\S+)\s*=\s*(\S+)/);
      if (ref = match[1], indexOf.call(valid_options, ref) < 0) {
        throw error("Invalid 'show' option: " + match[1]);
      }
      if (match != null) {
        params[match[1]] = match[2];
      }
    }
    L("Show: ", params);
    return this.lights.push(params);
  };

  FretboardDiv.prototype.parse = function(data) {
    var i, len, line, lines, match;
    L("Parsing: " + data);
    lines = data.split(/\n/);
    for (i = 0, len = lines.length; i < len; i++) {
      line = lines[i];
      line.trim();
      match = line.match(/^\s*option\s+(\S+)\s*=\s*(\S+)/);
      if (match != null) {
        this.setOption(match[1], match[2]);
      }
      match = line.match(/^\s*show\s+(.+)/);
      if (match != null) {
        this.show(match[1]);
      }
    }
    return true;
  };

  extractNumbers = function(str) {
    L("ExtractNumbers: ", str);
    str.trim();
    return str.split(/\s*,\s*/);
  };

  extractNotes = function(str) {
    var extracted_notes, i, len, note, notes, parts;
    L("ExtractNotes: ", str);
    str.trim();
    notes = str.split(/\s*,\s*/);
    extracted_notes = [];
    for (i = 0, len = notes.length; i < len; i++) {
      note = notes[i];
      parts = note.match(/(\d+)\/(\d+)/);
      if (parts != null) {
        extracted_notes.push({
          fret: parseInt(parts[1], 10),
          string: parseInt(parts[2], 10)
        });
      } else {
        throw error("Invalid note: " + note);
      }
    }
    return extracted_notes;
  };

  extractFrets = function(light) {
    var fret, frets, i, j, l, len, len1, len2, lights, note, notes, string, strings;
    if (light.fret != null) {
      frets = extractNumbers(light.fret);
    }
    if (light.frets != null) {
      frets = extractNumbers(light.frets);
    }
    if (light.string != null) {
      strings = extractNumbers(light.string);
    }
    if (light.strings != null) {
      strings = extractNumbers(light.strings);
    }
    if (light.note != null) {
      notes = extractNotes(light.note);
    }
    if (light.notes != null) {
      notes = extractNotes(light.notes);
    }
    if ((!((frets != null) && (strings != null))) && (notes == null)) {
      throw error("No frets or strings specified on line");
    }
    lights = [];
    if ((frets != null) && (strings != null)) {
      for (i = 0, len = frets.length; i < len; i++) {
        fret = frets[i];
        for (j = 0, len1 = strings.length; j < len1; j++) {
          string = strings[j];
          lights.push({
            fret: parseInt(fret, 10),
            string: parseInt(string, 10)
          });
        }
      }
    }
    if (notes != null) {
      for (l = 0, len2 = notes.length; l < len2; l++) {
        note = notes[l];
        lights.push(note);
      }
    }
    return lights;
  };

  FretboardDiv.prototype.lightsCameraAction = function() {
    var i, len, light, param, params, ref, results;
    L(this.lights);
    ref = this.lights;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      light = ref[i];
      params = extractFrets(light);
      results.push((function() {
        var j, len1, results1;
        results1 = [];
        for (j = 0, len1 = params.length; j < len1; j++) {
          param = params[j];
          if (light.color != null) {
            param.color = light.color;
          }
          if (light["fill-color"] != null) {
            param.fillColor = light["fill-color"];
          }
          L("Lighting up: ", param);
          if (light.text != null) {
            param.text = light.text;
            results1.push(this.fretboard.lightText(param));
          } else {
            results1.push(this.fretboard.lightUp(param));
          }
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  FretboardDiv.prototype.build = function(code) {
    var canvas, ps;
    if (code == null) {
      code = null;
    }
    L("Creating canvas id=" + this.id + " " + this.options.width + "x" + this.options.height);
    if (code == null) {
      code = $(this.sel).text();
    }
    this.parse(code);
    canvas = $("<canvas id=" + this.id + ">").attr("width", this.options.width).attr("height", this.options.height).attr("id", this.id).width(this.options.width);
    $(this.sel).replaceWith(canvas);
    ps = new paper.PaperScope();
    ps.setup(document.getElementById(this.id));
    this.fretboard = new Vex.Flow.Fretboard(ps, genFretboardOptions(this.options));
    this.fretboard.draw();
    return this.lightsCameraAction();
  };

  return FretboardDiv;

})();

// ---
// generated by coffee-script 1.9.2