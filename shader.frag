precision mediump float;

varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;

uniform float u_time;
uniform float u_z;

const int TOTAL_POINTS = 200; 

uniform float u_points[(TOTAL_POINTS + 1) * 3];


void main() {

    float max_dist = 1.732;

    float m_dist = max_dist; 

    for (int i = 0; i < (TOTAL_POINTS + 1) * 3; i+=3) {

        vec3 p = vec3(u_points[i], u_points[i + 1], u_points[i + 2]);
        vec3 obs = vec3(vTexCoord.x, vTexCoord.y, u_z);

        float dist = distance(obs, p);
        m_dist = min(m_dist, dist);
    }

    float color =  m_dist;
    
    float edge = 1.0 - smoothstep(0.0, 0.3, color);
    edge = pow(edge, 0.1);
    edge = smoothstep(0.7, 1.0, edge);

    color *= 6.0;
    // color = smoothstep(0.0, 0.1, color);
    color = 1.0 - color;

    float r = smoothstep(0.3, 0.65, color);
    float g = smoothstep(0.15, 0.7, color);
    float b = smoothstep(0.0, 0.95, color);



    gl_FragColor = vec4(r, g, b, 1.0);
    // gl_FragColor = vec4(edge, edge, edge, 1.0);
}
