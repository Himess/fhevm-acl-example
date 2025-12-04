const aclFunctions = [
  { num: 1, name: 'FHE.allow()', category: 'Basic', description: 'Grant permanent access' },
  { num: 2, name: 'FHE.allowThis()', category: 'Basic', description: 'Contract self-access' },
  { num: 3, name: 'FHE.allowTransient()', category: 'Basic', description: 'Same-transaction access' },
  { num: 4, name: 'FHE.isAllowed()', category: 'Checking', description: 'Check if address has access' },
  { num: 5, name: 'FHE.isSenderAllowed()', category: 'Checking', description: 'Check caller access' },
  { num: 6, name: 'FHE.makePubliclyDecryptable()', category: 'Public', description: 'Make value public' },
  { num: 7, name: 'FHE.isPubliclyDecryptable()', category: 'Public', description: 'Check if public' },
  { num: 8, name: 'FHE.delegateUserDecryption()', category: 'Delegation', description: 'Delegate decrypt rights', highlight: true },
  { num: 9, name: 'FHE.revoke...Delegation()', category: 'Delegation', description: 'Revoke delegation', highlight: true },
  { num: 10, name: 'FHE.getDelegated...Date()', category: 'Delegation', description: 'Get expiry date', highlight: true },
  { num: 11, name: 'FHE.isDelegatedFor...()', category: 'Delegation', description: 'Check delegation', highlight: true },
];

export function ACLReference() {
  return (
    <div className="acl-reference">
      <h3>All 11 ACL Functions</h3>
      <div className="acl-table">
        <div className="acl-header">
          <span>#</span>
          <span>Function</span>
          <span>Category</span>
        </div>
        {aclFunctions.map((fn) => (
          <div key={fn.num} className={`acl-row ${fn.highlight ? 'highlight' : ''}`}>
            <span className="num">{fn.num}</span>
            <span className="name">
              <code>{fn.name}</code>
              <small>{fn.description}</small>
            </span>
            <span className={`category ${fn.category.toLowerCase()}`}>{fn.category}</span>
          </div>
        ))}
      </div>
      <div className="acl-legend">
        <span className="legend-item highlight">
          <span className="dot"></span>
          Unique to this demo (Delegation)
        </span>
      </div>
    </div>
  );
}
