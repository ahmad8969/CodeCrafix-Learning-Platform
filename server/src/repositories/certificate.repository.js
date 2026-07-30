const { Certificate, CertificateTemplate, CertificateRule } = require('../models/Certificate')

module.exports = {
  findCertificateById: (id) => Certificate.findById(id),
  findCertificateByToken: (token) => Certificate.findOne({ verificationToken: token }),
  findCertificates: (filter, options = {}) => {
    let q = Certificate.find(filter)
    if (options.sort) q = q.sort(options.sort)
    if (options.skip) q = q.skip(options.skip)
    if (options.limit) q = q.limit(options.limit)
    if (options.populate) q = q.populate(options.populate)
    return options.lean ? q.lean() : q
  },
  countCertificates: (filter) => Certificate.countDocuments(filter),
  createCertificate: (data) => Certificate.create(data),
  findTemplates: (filter) => CertificateTemplate.find(filter),
  findRule: (filter) => CertificateRule.findOne(filter),
}
