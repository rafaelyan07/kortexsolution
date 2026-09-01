particlesJS("particles-js", {
  "particles": {
    "number": {
      "value": 90, /* Quantidade de pontos */
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": ["#8052ff", "#ffb829", "#15846e", "#ec4899", "#3b82f6"] /* Espectro cromático da constelação Dala */
    },
    "shape": {
      "type": "triangle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      }
    },
    "opacity": {
      "value": 0.6,
      "random": false,
      "anim": {
        "enable": false
      }
    },
    "size": {
      "value": 4,
      "random": true,
      "anim": {
        "enable": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#8052ff", /* Linhas em Electric Iris */
      "opacity": 0.35,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2, /* Velocidade da animação */
      "direction": "none",
      "random": false,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "grab" /* Quando passa o mouse, ele puxa as linhas */
      },
      "onclick": {
        "enable": true,
        "mode": "push" /* Quando clica, adiciona mais pontos */
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 140,
        "line_linked": {
          "opacity": 1
        }
      },
      "push": {
        "particles_nb": 4
      }
    }
  },
  "retina_detect": true
});
