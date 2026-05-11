export const STORES: Record<string, string> = {
    rawa: "متجر رواء",
    zero: "متجر زيرو",
    dribe: "متجر درايب"
};

export let activeUser: any = null;

export function setActiveUser(user: any) {
    activeUser = user;
}
