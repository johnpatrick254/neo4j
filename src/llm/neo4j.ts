import { driver as neo4jDriver, auth as neo4jAuth, ServerInfo, Driver } from "neo4j-driver";

const NEO4J_URL = process.env.NEO4J_URI
const NEO4J_USERNAME = process.env.NEO4J_USERNAME
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD

export class  Neo4jDB {
    private connection : Driver | null = null;

     async setConnection (){
        if (!NEO4J_PASSWORD || !NEO4J_USERNAME || !NEO4J_URL) {
            return null
        }

        try {
            const driver = neo4jDriver(
                NEO4J_URL,
                neo4jAuth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
                { disableLosslessIntegers: true }
            )
            await driver.getServerInfo()
            this.connection = driver
        } catch (error) {
            return null
        }
    }
    
     async getConnection (){
        if(!this.connection){
            await this.setConnection()
            return this.connection;
        }

        return this.connection
     }
    
}

