// Complaint Handlers Configuration
// Naya handler add karna ho to bas is array mein object add kar do — baaki code automatically kaam karega
export const COMPLAINT_HANDLERS = [
  { id: 'handler1', name: 'Complaint Handler 1', phone: '923111292746' },
  { id: 'handler2', name: 'Complaint Handler 2', phone: '923449004156' },
];

// Pehla handler hamesha default hoga (jab tak koi specific selection na ho)
export const DEFAULT_COMPLAINT_HANDLER = COMPLAINT_HANDLERS[0];