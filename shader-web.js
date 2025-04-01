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

const frag = `
precision mediump float;

varying vec2 vTexCoord;
uniform vec3 u_mouse;
uniform float u_time;
uniform float u_ratio;
uniform float u_z;

// Keep these uniforms for later use, but don't apply them yet
uniform float u_bass;
uniform float u_mid;
uniform float u_high;
uniform float u_avg;
uniform float u_level;

const float SIZE = 0.8; 
const vec2 RANGE = vec2(0.2, 0.8); 

void main() {
    vec2 normalizedTexCoord = vTexCoord;

   if (u_ratio > 1.0) { 
      normalizedTexCoord.y = normalizedTexCoord.y / u_ratio - 0.5 / u_ratio + 0.5;
      } else {
        normalizedTexCoord.x = normalizedTexCoord.x * u_ratio - 0.5 * u_ratio + 0.5;   
   }

    vec3 color = vec3(.0);

    // Cell positions
    vec3 point[30];
    // Original 15 points
    point[0] = vec3(0.83, 0.75, 0.50);   // Max z-value at 0.5
    point[1] = vec3(0.60, 0.07, 0.40);
    point[2] = vec3(0.28, 0.64, 0.30);
    point[3] = vec3(0.31, 0.26, 0.20);
    point[4] = vec3(0.15, 0.85, 0.10);
    point[5] = vec3(0.76, 0.32, 0.00);   // Middle point at 0.0
    point[6] = vec3(0.45, 0.50, -0.10);
    point[7] = vec3(0.22, 0.12, -0.20);
    point[8] = vec3(0.90, 0.42, -0.30);
    point[9] = vec3(0.55, 0.81, -0.40);
    point[10] = vec3(0.38, 0.92, -0.50); // Min z-value at -0.5
    point[11] = vec3(0.67, 0.18, 0.35);
    point[12] = vec3(0.12, 0.35, -0.35);
    point[13] = vec3(0.48, 0.67, 0.25);
    point[14] = u_mouse;
    
    // Add 15 more points to reach 30
    point[15] = vec3(0.22, 0.45, 0.48);
    point[16] = vec3(0.71, 0.53, -0.25);
    point[17] = vec3(0.43, 0.29, 0.38);
    point[18] = vec3(0.81, 0.13, -0.37);
    point[19] = vec3(0.32, 0.48, -0.18);
    point[20] = vec3(0.67, 0.89, 0.12);
    point[21] = vec3(0.17, 0.62, -0.45);
    point[22] = vec3(0.93, 0.21, 0.22);
    point[23] = vec3(0.37, 0.74, -0.33);
    point[24] = vec3(0.59, 0.38, 0.45);
    point[25] = vec3(0.13, 0.96, -0.15);
    point[26] = vec3(0.78, 0.43, 0.31);
    point[27] = vec3(0.41, 0.12, -0.42);
    point[28] = vec3(0.25, 0.56, 0.18);
    point[29] = vec3(0.86, 0.78, -0.27);

    // float max_dist = (u_avg + u_level) / 2.0;
    float max_dist = SIZE;

    float m_dist = max_dist; 

    // Iterate through the points positions (updated to 30)
    for (int i = 0; i < 30; i++) {
      vec3 obs = vec3(normalizedTexCoord.x, normalizedTexCoord.y, u_z);
      
      float dist = distance(obs, point[i]);
        
        // Keep the closest distance
        m_dist = min(m_dist, dist);
    }

    // Draw the min distance (distance field)
    color += m_dist;

    color = smoothstep(max_dist * u_high * RANGE.x, max_dist * u_mid * RANGE.y, color);
    // color = smoothstep(max_dist * RANGE.x, max_dist * RANGE.y, color);
    
    color = 1.0 - color;
    // color += u_level * 0.2;

    gl_FragColor = vec4(color, 1.0);
}
`;

export { frag, vert };
