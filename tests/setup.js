module.exports = async () => {
    // Force all tests to run in UTC timezone (i.e. same as our pipelines).
    process.env.TZ = 'UTC'
}
