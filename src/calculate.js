import consumtions from './anno-1800-calculator/data/consumption.json';
import nonProducers from './anno-1800-calculator/data/non-producers.json';
import producers from './anno-1800-calculator/data/producers.json';
import productionChain from './anno-1800-calculator/data/production-chain.json';

/**
 * @typedef {object} Population
 * @property {number} farmers
 * @property {number} workers
 * @property {number} artisans
 * @property {number} engineers
 * @property {number} investors
 * @property {number} jornaleros
 * @property {number} obreros
 */

/**
* @typedef {object} Maintenance
* @property {number} cash
* @property {number} farmers
* @property {number} workers
* @property {number} artisans
* @property {number} engineers
* @property {number} investors
* @property {number} jornaleros
* @property {number} obreros
*/

/**
* @typedef {object} Construction
* @property {number} cash
* @property {number} wood
* @property {number} brick
* @property {number} steel
* @property {number} window
* @property {number} concrete
* @property {number} influence
*/

/**
* @typedef {object} Building
* @property {string} product
* @property {string} building
* @property {string} img
* @property {number} worldID
* @property {number} productionTime
* @property {Construction} construction
* @property {Maintenance} maintenance
*/






/**
 * 
 * @param {string} socialClass 
 * @param {number} numPopulation 
 * @returns {{basic: {}, luxery: {}}}
 */
function getDemands(socialClass, numPopulation) {
    const demands = {};
    const demandsSinglePop = consumtions.Consumption[socialClass];
    for (let type in demandsSinglePop) {
        demands[type] = {};
        for (let product in demandsSinglePop[type]) {
            if (demandsSinglePop[type][product]) {
                demands[type][product] = demandsSinglePop[type][product] * numPopulation;
            } else {
                demands[type][product] = numPopulation > 0;
            }
        }
    }
    return demands;
}

/**
 * 
 * @param {object} buildings 
 * @returns {Maintenance}
 */
function getTotalMaintenace(buildings) {
    //data is incostistent with singular and plural writing, map it
    const map = {
        'farmer': 'farmers',
        'worker': 'workers',
        'artisan': 'artisans',
        'engineer': 'engineers',
        'investor': 'investors',
        'jornalero': 'jornaleros',
        'obrero': 'obreros'
    };

    const totalMaintenance = {};
    for (let name in buildings) {
        const quantityCeil = Math.ceil(buildings[name]);
        const building = producers.Producers[name] || nonProducers.buildings[name] || {};
        const maintenance = building.maintenance;

        if (maintenance && quantityCeil) {
            for (let key in maintenance) {
                const myKey = map[key] || key;
                totalMaintenance[myKey] = totalMaintenance[myKey] || 0;
                totalMaintenance[myKey] += maintenance[key] * quantityCeil;
            }
        }
    }
    return totalMaintenance;
}

/**
 * 
 * @param {string} product 
 * @returns {Building}
 */
function getBuildingByProduct(product) {
    return Object.values(producers.Producers).find(b => b.product === product);
}

/**
 * 
 * @param {string} product 
 * @returns {object}
 */
function getChainByProduct(product) {
    return Object.values(productionChain.Production_Chain).find(b => b.finalProduct === product);
}

/**
 * 
 * @param {Population} population 
 * @returns {object}
 */
function getTotalDemands(population) {
    const demandsBySocialClass = {};
    for (let socialClass in population) {
        demandsBySocialClass[socialClass] = getDemands(socialClass, population[socialClass]);
    }

    const totalDemands = {};
    for (let socialClass in demandsBySocialClass) {
        for (let type in demandsBySocialClass[socialClass]) {
            for (let product in demandsBySocialClass[socialClass][type]) {
                const quantity = demandsBySocialClass[socialClass][type][product];
                if (typeof quantity === 'boolean') {
                    totalDemands[product] = totalDemands[product] || quantity;
                } else {
                    totalDemands[product] = (totalDemands[product] + quantity) || quantity;
                }
            }
        }
    }
    return totalDemands;
}

export function getConsumables() {
    let consumables = [];
    for (let socialClass in consumtions.Consumption) {
        const c = consumtions.Consumption[socialClass];
        for (let type in c) {
            for (let product in c[type]) {
                if (c[type][product]) {
                    consumables.push(product);
                }
            }
        }
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    return consumables.filter(onlyUnique);
}

/**
 * 
 * @param {number} totalPopulation 
 */
export function calculateByTotalPopulation(totalPopulation) {
    const tryOrder = ['investors', 'engineers', 'artisans', 'workers', 'farmers'];


    let population = {
        farmers: 0,
        workers: 0,
        artisans: 0,
        engineers: 0,
        investors: 0,
        jornaleros: 0,
        obreros: 0,
    };

    let tryClass = 0;
    let result = { totalPopulation: 0 };


    do {

        if (tryOrder[tryClass] === 'farmers') {
            population['farmers'] += (totalPopulation - result.totalPopulation);
            result = calculate(population);
            break;
        }

        let lastPopulation = Object.assign({}, population);
        if (population[tryOrder[tryClass]] === 0) {
            population[tryOrder[tryClass]] += 1;
        } else {
            //skip some steps
            population[tryOrder[tryClass]] += Math.ceil((totalPopulation - result.totalPopulation) / 10);
        }

        result = calculate(population);

        let hasChanged = false;
        do {
            hasChanged = false;
            for (let socialClass in result.totalMaintenance) {
                if (population[socialClass] < result.totalMaintenance[socialClass]) {
                    population[socialClass] = result.totalMaintenance[socialClass];
                    hasChanged = true;
                }
            }

            result = calculate(population);

            if (result.totalPopulation > totalPopulation) {
                population = lastPopulation;
                result = calculate(population);
                tryClass++;
                break;
            }

        } while (hasChanged);


    } while (result.totalPopulation < totalPopulation);


    return result;
}
/**
 * 
 * @param {Population} totalPopulation 
 */
export function calculate(population) {
    const totalDemands = getTotalDemands(population);

    const requiredBuildings = {};
    for (let product in totalDemands) {
        if (typeof totalDemands[product] === 'number' && totalDemands[product] > 0) {
            const building = getBuildingByProduct(product);

            requiredBuildings[building.building] = requiredBuildings[building.building] || 0;
            requiredBuildings[building.building] += totalDemands[product] / (60 / building.productionTime);

            addChildrenChains(getChainByProduct(product));

            function addChildrenChains(chain) {
                if (chain && chain.children) {
                    chain.children.forEach(chain => {
                        const building = producers.Producers[chain.name];
                        totalDemands[building.product] = totalDemands[building.product] || 0;
                        totalDemands[building.product] += totalDemands[product];
                        requiredBuildings[building.building] = requiredBuildings[building.building] || 0;
                        requiredBuildings[building.building] += totalDemands[product] / (60 / building.productionTime);
                        addChildrenChains(chain);
                    });
                }
            }

        } else if (totalDemands[product] === true) {
            const building = nonProducers.buildings[product];
            if (building) {
                requiredBuildings[building.name] = true;
            }
        }
    }


    const totalMaintenance = getTotalMaintenace(requiredBuildings);

    let totalPopulation = 0;
    for (let socialClass in population) {
        totalPopulation += population[socialClass];
    }


    return {
        population: population,
        totalPopulation: totalPopulation,
        totalDemands: totalDemands,
        totalMaintenance: totalMaintenance,
        requiredBuildings: requiredBuildings,
    };

}