const vert = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  
  positionVec4.xy = positionVec4.xy * 2.0;
  
  vTexCoord = aTexCoord;
  
  gl_Position = positionVec4;
}
`;

function frag(number) {
  return `
    precision mediump float;

varying vec2 vTexCoord;

uniform float u_ratio;
uniform vec2 u_mouse;

uniform float u_time;
uniform float u_z;

uniform float u_contrast;
uniform float u_n;
uniform float u_exposure;

const int TOTAL_POINTS = ${number}; 

uniform vec2 u_range;

uniform float u_points[(TOTAL_POINTS + 1) * 3];


void main() {

    vec2 normalizedTexCoord = vTexCoord;

   if (u_ratio > 1.0) { 
      normalizedTexCoord.y = normalizedTexCoord.y / u_ratio - 0.5 / u_ratio + 0.5;
      } else {
        normalizedTexCoord.x = normalizedTexCoord.x * u_ratio - 0.5 * u_ratio + 0.5;   
   }
   
    float max_dist = u_contrast;

    float m_dist = max_dist; 
    

    for (int i = 0; i < (TOTAL_POINTS + 1) * 3; i+=3) {

        vec3 p = vec3(u_points[i], u_points[i + 1], u_points[i + 2]);
        vec3 obs = vec3(normalizedTexCoord.x, normalizedTexCoord.y, u_z);

        float dist = distance(obs, p);
        m_dist = min(m_dist, dist);
    }

    float color =  m_dist;

    color = smoothstep(max_dist * u_range.x, max_dist * u_range.y, color);

    color = 1.0 - color;
    // color = (1.0 - vTexCoord.x) + (vTexCoord.x * 2.0 - 1.0) * color;


    gl_FragColor = vec4(color, color, color, 1.0);
}   
    `;
}

export { frag, vert };
