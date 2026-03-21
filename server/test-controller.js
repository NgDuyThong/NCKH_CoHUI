const { runCoIUMProcess } = require('./controllers/CoIUMProcessController');

const mockReq = {};
const mockRes = {
    json: function(data) {
        console.log('\n=== API RESPONSE ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('====================\n');
    },
    status: function(code) {
        this.statusCode = code;
        return this;
    }
};

console.log('Testing CoIUM API...\n');
runCoIUMProcess(mockReq, mockRes);
