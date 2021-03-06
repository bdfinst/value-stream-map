import { isNode } from 'react-flow-renderer'
import validateKeys from 'object-key-validator'

import { calcFlowEfficiency, getNodesums, roundTo2 } from '../helpers'
import { default as elementFixture } from '../__mocks__/elements'

let elements
elements = elementFixture(10)

describe('Building totals', () => {
  let results
  let processTime
  let waitTime
  let reworkTime
  beforeEach(() => {
    results = getNodesums(elements)

    processTime = elements
      .filter((el) => isNode(el))
      .reduce((acc, el) => {
        return acc + el.data.processTime
      }, 0)

    waitTime = elements
      .filter((el) => isNode(el))
      .reduce((acc, el) => {
        return acc + el.data.waitTime
      }, 0)

    reworkTime = elements
      .filter((el) => isNode(el))
      .reduce((acc, el) => {
        return (
          acc +
          el.data.processTime * ((100 - el.data.pctCompleteAccurate) / 100)
        )
      }, 0)
  })

  it('should have the correct properties', () => {
    const rule = {
      $and: [
        'processTime',
        'waitTime',
        'totalTime',
        'flowEfficiency',
        'avgPCA',
        'peopleTime',
        'averageActors',
      ],
    }

    expect(validateKeys(rule, results)).toEqual(true)
  })
  it('should calculate flow efficiency', () => {
    const workTime = 10
    const totalTime = 20
    const expectedFE = 50
    expect(calcFlowEfficiency(workTime, totalTime)).toEqual(expectedFE)
  })
  it('should calacuate the total manual process time', () => {
    const peopleTime = elements
      .filter((el) => isNode(el))
      .map((node) => node.data)
      .reduce((acc, val) => acc + val.people * val.processTime, 0)

    expect(results.peopleTime).toEqual(peopleTime)
  })
  it('should calculate the total process time', () => {
    expect(results.processTime).toEqual(processTime)
  })
  it('should sum the the average number of people per process', () => {
    expect(results.averageActors).toEqual(1)
  })
  it('should sum the total time waiting to start work', () => {
    expect(results.waitTime).toEqual(waitTime)
  })
  it('should sum the total duration of the value stream', () => {
    const totalTime = processTime + waitTime + reworkTime

    expect(results.totalTime).toEqual(totalTime)
  })
  it('should calculate the flow efficiency', () => {
    const totalTime = processTime + waitTime + reworkTime
    const flowEfficiency = roundTo2((processTime / totalTime) * 100)

    expect(results.flowEfficiency).toEqual(flowEfficiency)
  })
  it('should average the rework percentage of the value stream', () => {
    const pca = 10
    const num = 3
    elements = elementFixture(num, pca)

    results = getNodesums(elements)

    expect(results.avgPCA).toEqual((pca + pca / 2) / 2)
  })

  it('should show the total rework time', () => {
    expect(results.reworkTime).toEqual(reworkTime)
  })
})
