import http from "http";
const port = 3000;
const server = http.createServer((req, res) => {
    const response = {
        message: "API RESTAURANTE",
        version: "1.0.0",
        xpto: "qualquer coisa"
    };
    res.writeHead(200, {
        "content-type": "application/json"
    });
    res.end(JSON.stringify(response));
});
server.listen(port, () => {
    console.log(`Server executando em http://localhost:${port}/`);
});
//# sourceMappingURL=server.js.map