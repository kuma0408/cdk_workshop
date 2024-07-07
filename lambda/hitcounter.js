const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');


exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // create AWS SDK clients
    const dynamo = new DynamoDBClient();
    const lambda = new LambdaClient();

    // update dynamo entry for "path" with hits++
    await dynamo.send(new UpdateItemCommand({
        TableName: process.env.HITS_TABLE_NAME,
        Key: { path: { S: event.path }},
        UpdateExpression: 'ADD hits :incr',
        ExpressionAttributeValues: { ':incr': { N: '1' }},
    }));

    // call downstream function and capture response
    const resp = await lambda.send(new InvokeCommand({
        FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
        Payload: JSON.stringify(event),
    }));

    console.log('downstream response:', JSON.stringify(resp, undefined, 2));

    // return response back to upstream caller
    return JSON.parse(Buffer.from(resp.Payload).toString());
}