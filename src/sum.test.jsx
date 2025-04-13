const sum = require('./sum');

describe("Learing tests",()=>{
  it("checks if objects are the same",()=>{
    const obj = {}
    expect(obj).toEqual({})
  })

  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toEqual(3);
  });

})


describe("truthy or falsey",()=>{
    it("null",()=>{
      const n=null;
      expect(n).toBeFalsy()
      expect(n).toBeNull()
    })
})

describe("numbers",()=>{

  it("2+2",()=>{
    expect(2+2).toBeGreaterThan(3)
    expect(2+2).toBeGreaterThanOrEqual(3)
    expect(2+2).toBeLessThanOrEqual(7)
  })

  it("adding floats",()=>{
    const value = 0.1+0.3;
    expect(value).toBeCloseTo(0.4)
  })

})

describe("Strings",()=>{
  it("there is no I in team",()=>{
    expect("team").not.toMatch(/I/)

  })
})

describe("exceptions",()=>{
  it("Compiling android goes expected",()=>{
    expect(()=>compiledCode()).toThrow()
  })
})


function compiledCode(){
  throw new console.error("You are using the wrong jdk");
  
}