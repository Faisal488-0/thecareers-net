import * as am5 from 'https://esm.sh/@amcharts/amcharts5@5';
import * as am5map from 'https://esm.sh/@amcharts/amcharts5@5/map';
import am5themes_Animated from 'https://esm.sh/@amcharts/amcharts5@5/themes/Animated';
import worldLow from 'https://esm.sh/@amcharts/amcharts5-geodata@5/worldLow';

const el=document.getElementById('chartdiv');
if(el){
  try{
    const root=am5.Root.new('chartdiv');
    root.setThemes([am5themes_Animated.new(root)]);
    const chart=root.container.children.push(am5map.MapChart.new(root,{
      projection:am5map.geoOrthographic(),panX:'rotateX',panY:'rotateY',wheelY:'zoom',wheelX:'none',pinchZoom:true,
      minZoomLevel:.8,maxZoomLevel:2.3,rotationX:-48,rotationY:-18,zoomLevel:1.02
    }));
    const countries=chart.series.push(am5map.MapPolygonSeries.new(root,{geoJSON:worldLow}));
    countries.mapPolygons.template.setAll({fill:am5.color(0xc9d5e5),fillOpacity:.97,stroke:am5.color(0xf2f6fb),strokeOpacity:.92,strokeWidth:.7,tooltipText:'{name}',interactive:true});
    countries.mapPolygons.template.states.create('hover',{fill:am5.color(0xdce7f5)});
    const grid=chart.series.push(am5map.GraticuleSeries.new(root,{}));
    grid.mapLines.template.setAll({stroke:am5.color(0x7793b3),strokeOpacity:.14,strokeWidth:.6});

    const points=chart.series.push(am5map.MapPointSeries.new(root,{}));
    points.bullets.push(()=>am5.Bullet.new(root,{sprite:am5.Circle.new(root,{radius:2.5,fill:am5.color(0xffffff),stroke:am5.color(0x70a8ff),strokeWidth:1.2})}));
    const add=(name,lat,lon)=>points.pushDataItem({name,latitude:lat,longitude:lon});
    const kw=add('Kuwait — AI Core',29.3759,47.9774);
    const cities=[
      ['Dubai',25.2048,55.2708],['Riyadh',24.7136,46.6753],['Doha',25.2854,51.531],['Manama',26.2235,50.5876],['Muscat',23.588,58.3829],
      ['Cairo',30.0444,31.2357],['Istanbul',41.0082,28.9784],['London',51.5072,-.1276],['Frankfurt',50.1109,8.6821],['Paris',48.8566,2.3522],
      ['Mumbai',19.076,72.8777],['Delhi',28.6139,77.209],['Singapore',1.3521,103.8198],['Tokyo',35.6762,139.6503],['Seoul',37.5665,126.978],
      ['New York',40.7128,-74.006],['Toronto',43.6532,-79.3832],['Sydney',-33.8688,151.2093],['Nairobi',-1.2921,36.8219],['Johannesburg',-26.2041,28.0473]
    ].map(c=>add(c[0],c[1],c[2]));

    const lines=chart.series.push(am5map.MapLineSeries.new(root,{lineType:'curved'}));
    lines.mapLines.template.setAll({stroke:am5.color(0x6ca2ff),strokeWidth:1.2,strokeOpacity:.55});
    const particles=chart.series.push(am5map.MapPointSeries.new(root,{}));
    particles.bullets.push(()=>am5.Bullet.new(root,{sprite:am5.Circle.new(root,{radius:2.3,fill:am5.color(0xffffff),stroke:am5.color(0x79aaff),strokeWidth:1})}));
    cities.forEach((city,i)=>{
      const line=lines.pushDataItem({pointsToConnect:[kw,city]});
      [0.12,0.48,0.78].forEach((pos,j)=>{
        const p=particles.pushDataItem({lineDataItem:line,positionOnLine:pos});
        p.animate({key:'positionOnLine',to:1,duration:4300+j*1700+i*75,loops:Infinity,easing:am5.ease.linear});
      });
    });

    const core=chart.series.push(am5map.MapPointSeries.new(root,{}));
    core.bullets.push(()=>{
      const c=am5.Container.new(root,{});
      [8,14,21].forEach((r,i)=>{const ring=c.children.push(am5.Circle.new(root,{radius:4,fillOpacity:0,stroke:am5.color(i===2?0x7eb8ff:0x39b36b),strokeWidth:i===0?1.4:.9,strokeOpacity:i===0?.52:.26}));ring.animate({key:'radius',from:4,to:r,duration:1500+i*280,loops:Infinity});ring.animate({key:'strokeOpacity',from:i===0?.52:.26,to:0,duration:1500+i*280,loops:Infinity});});
      c.children.push(am5.Circle.new(root,{radius:4.2,fill:am5.color(0x39b36b),stroke:am5.color(0xffffff),strokeWidth:1.3,tooltipText:'Kuwait — AI Search Core'}));
      return am5.Bullet.new(root,{sprite:c});
    });
    core.pushDataItem({latitude:29.3759,longitude:47.9774});

    let rot=null,timer=null;
    const stop=()=>{if(rot){rot.stop();rot=null;}};
    const spin=()=>{stop();const from=chart.get('rotationX')||-48;rot=chart.animate({key:'rotationX',from,to:from+360,duration:62000,loops:Infinity,easing:am5.ease.linear});};
    spin();
    const stage=document.getElementById('globeStage');
    stage?.addEventListener('pointerdown',()=>{stop();clearTimeout(timer);});
    stage?.addEventListener('pointerup',()=>{clearTimeout(timer);timer=setTimeout(spin,900);});
    stage?.addEventListener('dblclick',()=>{stop();chart.animate({key:'rotationX',to:-48,duration:350});chart.animate({key:'rotationY',to:-18,duration:350});chart.animate({key:'zoomLevel',to:1.02,duration:350});timer=setTimeout(spin,700);});
    chart.appear(700,50);
  }catch(err){
    console.error('TheCareers globe init failed',err);
    el.innerHTML='<div style="position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle at 35% 25%,#fff,#d6e4f4 38%,#9db7d4 70%,#6f8ba9);box-shadow:inset 0 0 40px rgba(255,255,255,.65),0 15px 35px rgba(68,96,130,.18)"></div>';
  }
}
