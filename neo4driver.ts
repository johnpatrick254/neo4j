import neo4j, {Driver, Integer, ManagedTransaction, Neo4jError, Node, Relationship} from "neo4j-driver"

const NEO4J_URL = "neo4j+s://2873166b.databases.neo4j.io"
const NEO4J_USERNAME = "neo4j"
const NEO4J_PASSWORD = "PUQ4-ZmVp7oJi3V5xJ-zkiCBXTSR_vIKom5M9Ghdgw8"


 class Neo4jDriver {
    
    private driver:Driver | null = null
    constructor(){
        
        try {
            this.driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
            
        }
        catch(e){
              throw new Error(e.message)
        }
    }
     
    async executeRead(cypher:string,config: {[key:string]:[value:any]}) {
          const session = this.driver.session();
          try {
           const result= await session.executeRead((tx:ManagedTransaction)=>tx.run(cypher,config))
            return result.records  
        } catch (error) {
             console.error(error)
          }finally{
           await session.close()
          }
    }

     async executeWrite(cypher: string, config: { [key: string]: [value: any] }) {
         const session = this.driver.session();
         try {
             const result = await session.executeWrite((tx: ManagedTransaction) => tx.run(cypher, config))
             return result.records  
         } catch (error) {
             console.error(error)
         } finally {
             await session.close()
         }
     }
 }   


