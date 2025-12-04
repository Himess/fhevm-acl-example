import { CheckCircle, XCircle } from 'lucide-react';

const aclFunctions = [
  { num: 1, name: 'FHE.allow()', category: 'Basic', common: true, description: 'Grant permanent access' },
  { num: 2, name: 'FHE.allowThis()', category: 'Basic', common: true, description: 'Contract self-access' },
  { num: 3, name: 'FHE.allowTransient()', category: 'Basic', common: false, description: 'Same-transaction access' },
  { num: 4, name: 'FHE.isAllowed()', category: 'Checking', common: true, description: 'Check if address has access' },
  { num: 5, name: 'FHE.isSenderAllowed()', category: 'Checking', common: false, description: 'Check caller access' },
  { num: 6, name: 'FHE.makePubliclyDecryptable()', category: 'Public', common: false, description: 'Make value public' },
  { num: 7, name: 'FHE.isPubliclyDecryptable()', category: 'Public', common: false, description: 'Check if public' },
  { num: 8, name: 'FHE.delegateUserDecryption()', category: 'Delegation', common: false, description: 'Delegate decrypt rights', highlight: true },
  { num: 9, name: 'FHE.revokeUserDecryptionDelegation()', category: 'Delegation', common: false, description: 'Revoke delegation', highlight: true },
  { num: 10, name: 'FHE.getDelegated...ExpirationDate()', category: 'Delegation', common: false, description: 'Get expiry date', highlight: true },
  { num: 11, name: 'FHE.isDelegatedForUserDecryption()', category: 'Delegation', common: false, description: 'Check delegation', highlight: true },
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
          <span>Common?</span>
        </div>
        {aclFunctions.map((fn) => (
          <div key={fn.num} className={`acl-row ${fn.highlight ? 'highlight' : ''}`}>
            <span className="num">{fn.num}</span>
            <span className="name">
              <code>{fn.name}</code>
              <small>{fn.description}</small>
            </span>
            <span className={`category ${fn.category.toLowerCase()}`}>{fn.category}</span>
            <span className="common">
              {fn.common ? (
                <CheckCircle size={16} className="yes" />
              ) : (
                <XCircle size={16} className="no" />
              )}
            </span>
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
