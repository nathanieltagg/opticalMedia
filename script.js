
$(function(){
  applet = new Applet($('div#sim'));
});


function Applet(element, options)
{
  if(!element) { 
    console.log("Pad: NULL element provided."); return; 
  }
  if($(element).length<1) { 
    console.log("Pad: Zero-length jquery selector provided."); return;
  }
  this.element = $(element).get(0); 
  
  this.bg_color = "white";
  this.origin_x = 0.0;
  this.origin_y = 0.0;
  this.width_x  = 10.0;
  
  // Merge in the options.
  $.extend(true,this,options);

  // Merge in options from element
  var element_settings = $(element).attr('settings');
  var element_settings_obj={};
  // if(element_settings) {
  //   eval( "var element_settings_obj = { " + element_settings + '};');; // override from 'settings' attribute of html object.
  //   console.log(element_settings, element_settings_obj);
  //   $.extend(true,this,element_settings_obj); // Change default settings by provided overrides.
  //
  // }
  // Look for an existing canvas, and build one if it's not there.
  if($('canvas',this.element).length<1) {
    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);
  } else {
    this.canvas = $('canvas',this.element).get(0);    
  }
  
  if(!element) { 
    console.log("Pad: NULL element provided."); return; 
  }
  if($(element).length<1) { 
    console.log("Pad: Zero-length jquery selector provided."); return;
  }
  this.element = $(element).get(0); 

  var self = this;

  // Build the drawing context.
  this.ctx = this.canvas.getContext('2d');
  // if(initCanvas) this.ctx = initCanvas(this.canvas).getContext('2d');
  if(!this.ctx) console.log("Problem getting context!");
  if( !$(this.element).is(":hidden") ) {
    width = $(this.element).width();
    height = $(this.element).height(); 
  }
  this.canvas.width = this.width = width;
  this.canvas.height = this.height = height;

  this.atoms = [
    // [this.width/4,this.height/3],
    // [this.width/4,this.height*2/3],
    // [this.width/2,this.height/3],
    // [this.width/2,this.height*2/3],
    [this.width*2/5,this.height/2],
    [this.width*3/5,this.height/2],
    [this.width*4/5,this.height/2],

    // [this.width*1/5,this.height/3],
    [this.width*2/5,this.height/3],
    [this.width*3/5,this.height/3],
    [this.width*4/5,this.height/3],

    [this.width*3/10,this.height/2],
    [this.width*5/10,this.height/2],
    [this.width*7/10,this.height/2],
    // [this.width*1/10,this.height/3],
    [this.width*3/10,this.height/3],
    [this.width*5/10,this.height/3],
    [this.width*7/10,this.height/3],


  ];

  this.atoms = [];
  var rows =4;
  var columns =5
  for(var row=0;row<rows;row++)
    for(var column=0;column<columns;column++) {
      var x = ((column/columns)*3/5 + 1/5)*this.width;
      var y = ((row/rows)*3/5 + 1/5)*this.height;
      this.atoms.push([x,y]);
    }

  this.atoms = [];
  for(i=0;i<40;i++) {
    this.atoms.push( [Math.random()*this.width/2+this.width/4, Math.random()*this.height/2+this.height/4]);
  }

  this.amp = 1;

  this.wavelength = parseFloat($("#ctl-wavelength").val());
  $('#show-wavelength').text(self.wavelength);

  this.period = parseFloat($("#ctl-period").val());
  $('#show-period').text(self.period);

  self.v = self.wavelength/self.period;

  self.phase_deg = parseFloat($("#ctl-phase").val());
  $('#show-phase').html(self.phase_deg + "&#8451;");
  self.phase = ((self.phase_deg+360)%360)/180*Math.PI;


  this.animating = true;
  this.last_frame_t = Date.now();
  this.t_ms = 0;


  this.phase = 0;
  this.phase = -90/180*Math.PI;
  this.scatteramp = 0.2;

  $("#ctl-animate").on("change",function(){
    self.animating = $(this).is(":checked");
    console.error("animate toggle",self.animating);
    self.last_frame_t = Date.now();
    if(self.animating) self.DoFrame();
  })

   $("#ctl-wavelength").on("change",function(){
    self.wavelength =parseFloat($(this).val());
	self.v = self.wavelength/self.period;
    $('#show-wavelength').text(self.wavelength);
  })
   $("#ctl-period").on("change",function(){
    self.period =parseFloat($(this).val());
    self.v = self.wavelength/self.period;
    $('#show-period').text(self.period);
  })

   $("#ctl-phase").on("change",function(){
   	  self.phase_deg = parseFloat($("#ctl-phase").val());
	  $('#show-phase').html(self.phase_deg + "&#8451;");
      self.phase = ((self.phase_deg-360)%360)/180*Math.PI;
   	 console.error("new phase",self.phase);
   })

   $("#ctl-reset").on("click",function(){
      self.t_ms = 0;
      if(!self.animating) $("#ctl-animate").click();
  })


  this.Resize();
  $(window).on("resize",this.Resize.bind(this));


  this.DoFrame()


}

Applet.prototype.DoFrame = function()
{
  var now = Date.now();
  this.t_ms += (now-this.last_frame_t)
  this.last_frame_t = now; 
  var t = this.t_ms/1000;

  console.log("DoFrame t=",t);
  for(var x=0; x<this.width; x+= 5) {
      for(var y=0; y<this.height; y+=5) {
        var psi = this.field(x,y,t);
        this.ctx.fillStyle = "rgb("+parseInt(psi*128+128)+","+0+","+parseInt(psi*128+128)+")";

        this.ctx.fillRect(x,y,5,5);
        
      }
  }

  this.DrawAtoms(t);

  this.DrawPlaneWaveFront(t);

  this.DrawScatteredWaveFronts(t);

    // Continue
  if(this.animating) {
    window.requestAnimationFrame(this.DoFrame.bind(this));
  }

}



Applet.prototype.Resize = function()
{
  console.log("Applet::Resize()",this);
  var width = $(this.element).width();
  var height = $(this.element).height(); 
  this.canvas.width = this.width = width;
  this.canvas.height = this.height = height;
  // this.Draw();
}


Applet.prototype.Clear = function()
{
  if (!this.ctx) return;
  this.ctx.fillStyle = this.bg_color;
  this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
}



Applet.prototype.PlaneWave = function(x,t)
{
  var theta = Math.PI*2*(x/this.wavelength - t/this.period);
  // console.log(",x,t,theta);
  if(theta>0) return 0; // wave not hit yet.
  return this.amp * Math.sin(theta);
}

Applet.prototype.DrawAtoms = function(t)
{
  for(var atom of this.atoms) {
      this.ctx.beginPath();
      this.ctx.arc(atom[0],atom[1],7,0,2*Math.PI,false);
      this.ctx.fillStyle = "pink";
      this.ctx.fill();
  }

}




Applet.prototype.DrawPlaneWaveFront = function(t)
{
  // wavefront is at x = vt + (i)lambda
  // first one is at i = -vt/lambda
  this.ctx.strokeStyle="green";
  this.ctx.lineWidth =2;
  this.ctx.beginPath();
  var x = (this.v*t-this.wavelength*0.25)%(this.wavelength);
  // console.log('wavefront',x);
  for( x ; x<this.width; x+=this.wavelength) {
    if(x-this.v*t > 0) continue;
    this.ctx.moveTo(x,0); this.ctx.lineTo(x,this.height);
  }

  this.ctx.stroke();
}

Applet.prototype.DrawScatteredWaveFronts = function(t)
{
  this.ctx.strokeStyle="green";
  this.ctx.lineWidth =2;
  for(var atom of this.atoms) {
    // similar to wavefronts above.
    var x = atom[0];
    var theta = (x-this.v*t+this.wavelength*0.25)*2*Math.PI/this.wavelength;
    theta -= this.phase;
    theta = theta % (2*Math.PI)
    // first wave hits at theta<=0
    for(var i = 0; i<1; i++) {
      var theta1 = theta - i*2*Math.PI;      
      if(theta1>0) continue;
      var r = -theta1*this.wavelength/(2*Math.PI);
      if(r<0) continue;
      // console.log(r);
      this.ctx.beginPath();
      this.ctx.arc(atom[0],atom[1],r,0,2*Math.PI,false);
      this.ctx.stroke();
    }
  }

}


Applet.prototype.scatteredField = function(x,y,t, atom)
{
  // distance to atom
  var dx = atom[0]-x; 
  var dy = atom[1]-y;
  var r = Math.sqrt(dx*dx + dy*dy);
  var dt = r/this.v;
  dt -= this.phase*this.period/(2*Math.PI);
  var scat = this.scatteramp * this.PlaneWave(atom[0],t-dt);
  // console.log(atom,x,y,t,r,dt,scat);
  return scat;

}

Applet.prototype.field = function(x,y,t)
{
  var psi = this.PlaneWave(x,t);
  for(var atom of this.atoms) {
      psi+=this.scatteredField(x,y,t,atom);
  }
  return psi;
}


