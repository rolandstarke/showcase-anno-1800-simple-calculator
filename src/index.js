import { calculateByTotalPopulation, getConsumables } from './calculate';
import socialClasses from './anno-1800-calculator/data/social-classes.json';
import nonProducers from './anno-1800-calculator/data/non-producers.json';
import producers from './anno-1800-calculator/data/producers.json';
import productionChain from './anno-1800-calculator/data/production-chain.json';
import throttle from 'lodash/throttle';
import Vue from 'vue';


var app = new Vue({
    el: '#app',
    data: {
        desiredPopulation: 0,
        result: {},
        consumables: getConsumables(),
    },
    methods: {
        pupulationImage(socialClass) {
            return 'src/anno-1800-calculator/assets/population/' + socialClasses[socialClass].img;
        },
        pupulationName(socialClass) {
            return socialClasses[socialClass].name;
        },
        buildingImage(name) {
            return 'src/anno-1800-calculator/assets/buildings/' + (producers.Producers[name] || nonProducers.buildings[name]).img;
        },
        buildingName(name) {
            if (name === 'Slaughterhouse') {
                return 'Slaughter house'
            }
            return name;
        },
    },
    created() {
        this.throttledUpdate = throttle(() => {
            const result = calculateByTotalPopulation(this.desiredPopulation);
            console.log(JSON.parse(JSON.stringify(result)));
            this.result = result;
        }, 100, { trailing: true });
    },
    computed: {
        population() {
            let population = {};
            for (let name in this.result.population) {
                if (this.result.population[name] > 0) {
                    population[name] = this.result.population[name];
                }
            }
            return population;
        },
        buildingsConsume() {
            let buildings = {};
            for (let name in this.result.requiredBuildings) {
                if (producers.Producers[name] && this.consumables.indexOf(producers.Producers[name].product) >= 0) {
                    buildings[name] = this.result.requiredBuildings[name];
                }
            }
            return buildings;
        },
        buildingsProducers() {
            let buildings = {};
            for (let name in this.result.requiredBuildings) {
                if (producers.Producers[name] && this.consumables.indexOf(producers.Producers[name].product) === -1) {
                    buildings[name] = this.result.requiredBuildings[name];
                }
            }
            return buildings;
        },
        buildingsNonProducers() {
            let buildings = {};
            for (let name in this.result.requiredBuildings) {
                if (nonProducers.buildings[name]) {
                    buildings[name] = this.result.requiredBuildings[name];
                }
            }
            return buildings;
        }
    },
    watch: {
        desiredPopulation() {
            this.throttledUpdate();
        },
    }
});


/**
 * cool animation stuff
 */

const canvas = document.querySelector('#canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//window.addEventListener('resize', e => calculator.resize(window.innerWidth, window.innerHeight));
