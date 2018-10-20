var eosjs = '';
var eos = null;
var scatter = null;
var loginflag = 0;
var sellersel = '';
var sellerprice = '';
var buyersel = '';
var buyerprice = '';
var curcoindeal = 'all';
var g_curtpwallet = '';
var g_curtpwalletaddress = '';
var g_curliquideos = '';
var getcoinsflag = 0;
var getcoinsflagex = 0;
var g_curexchangecontract = '';
var g_curexchangetoken = '';
var g_ordertype = '';
var g_exchangetype = '';
var g_coindexcontract = "cointotheeos";
var network = {
	blockchain: 'eos',
	protocol: 'http',
	host: 'openapi.eos.ren',
	port: 80,
	chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};

function EosjsInit() {
	var eosConfig = {
		chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
		httpEndpoint: 'http://openapi.eos.ren',
		verbose: false
	}

	eosjs = Eos(eosConfig);
}

function gettpwalletlist() {
	if (tp.isConnected() == true) {
		$("#tpwalletlistdiv").show();
		tp.getWalletList('eos').then(data => {
			var accountcnt = data["wallets"]["eos"].length;
			var $accountlistid = $("#tpwalletlist");
			$accountlistid.empty();
			for (var i = 0; i <= accountcnt; i++) {
				var accountname = data["wallets"]["eos"][i]["name"];
				var address = data["wallets"]["eos"][i]["address"];
				$accountlistid.append(new Option(accountname, accountname+' '+address));
				if (i == 0) {
					g_curtpwallet = accountname;
					g_curtpwalletaddress = address;
					checkshishicai(g_curtpwallet);
				}
			}
		})
	}
}

function tpwalletlistchange(obj) {
	g_curtpwallet = $(obj).val().split(' ')[0];
	g_curtpwalletaddress = $(obj).val().split(' ')[1];
	checkshishicai(g_curtpwallet);
}

function getaccountinfo(accountname) {
	eosjs.getAccount(accountname, function (error, data) {
		if (error == null) {
			if(data["core_liquid_balance"] == undefined)
			{
				g_curliquideos = 0.0000;
				$("#exchangeinfobalance").text("余额:0.0000 EOS");
			}
			else{
				$("#exchangeinfobalance").text("余额:" + data["core_liquid_balance"]);
				g_curliquideos = $("#exchangeinfobalance").text().split(' ')[0];
			}
		} else {
			Dialog.init(error);
		}
	})
}

function formatDateTime(inputTime) {
	if (inputTime == 0) {
		return "未记录";
	}
	var date = new Date(inputTime);
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	m = m < 10 ? ('0' + m) : m;
	var d = date.getDate();
	d = d < 10 ? ('0' + d) : d;
	var h = date.getHours();
	h = h < 10 ? ('0' + h) : h;
	var minute = date.getMinutes();
	var second = date.getSeconds();
	minute = minute < 10 ? ('0' + minute) : minute;
	second = second < 10 ? ('0' + second) : second;
	return y + '/' + m + '/' + d + ' ' + h + ':' + minute + ':' + second;
};

function swapRow(i, k) {
	var tb = $("#sellertablebody").find("tr");
	$(tb).eq(k).insertBefore($(tb).eq(i));
	$(tb).eq(i).insertAfter($(tb).eq(k));

}

function SortTb(obj, col) {

	var tb = obj.find("tr");
	var total = tb.length;
	//外层循环，共要进行arr.length次求最大值操作
	for (var i = 0; i < total; i++)
	{
		//内层循环，找到第i大的元素，并将其和第i个元素交换
		for (var j = i; j < total; j++)
		{
			var v = $(tb).eq(i).find("td").eq(col).find("p").html().split(' ')[0];
			var v2 = $(tb).eq(j).find("td").eq(col).find("p").html().split(' ')[0];
			if (v > v2)
			{
				//交换两个元素的位置
				swapRow(i, j);
				tb = obj.find("tr");
			}
		}
	}
	return;
}

function getuserbalance(contract, token) {
	eosjs.getTableRows(true, contract, $("#usernamea").html().split(' ')[0], "accounts", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt == 0) {
				$("#pushorderbalance").text("余额:0.0000 " + token);
				$("#exchangeinfobalance").text("余额:0.0000 " + token);
			} else {
				for (var i = 0; i < cnt; i++) {
					var balance = data["rows"][i]["balance"];
					if (balance.split(' ')[1] == token) {
						$("#pushorderbalance").text("余额:" + balance);
						$("#exchangeinfobalance").text("余额:" + balance);
						break;
					}
				}

				if (i == cnt) {
					$("#pushorderbalance").text("余额:0.0000 " + token);
					$("#exchangeinfobalance").text("余额:0.0000 " + token);
				}
			}
		} else {
			console.log(error);
		}
	})
}

function transfersellorder(dialog) {
	try {
		console.log("transfersellorder enter");
		var orderprice = accMul($("#pushorderprice").val(), 1000000);
		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract(g_curexchangecontract, options).then(contract => {
				contract.transfer(account.name, g_coindexcontract, $("#pushordercount").val() + '.0000 ' + g_curexchangetoken, "0 "+g_curexchangetoken+" "+orderprice, options).then(function (tx) {
					Dialog.init('Success!');
					dialog.dialog( "close" );
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})
	} catch (e) {
		Dialog.init(e);
	}
}

function transferbuyorder(dialog) {
	try {
		console.log("transferbuyorder enter");
		var orderprice = accMul($("#pushorderprice").val(), 1000000);
		var totaleos = accMul($("#pushordercount").val(), $("#pushorderprice").val());
		if (totaleos.toFixed(4) != totaleos) {
			if (totaleos.toFixed(4) < totaleos) {
				totaleos = totaleos + 0.0001;
			}
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract("eosio.token", options).then(contract => {
				contract.transfer(account.name, g_coindexcontract, totaleos.toFixed(4) + " EOS", "1 "+g_curexchangetoken+" "+orderprice, options).then(function (tx) {
					Dialog.init('Success!');
					dialog.dialog( "close" );
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})
	} catch (e) {
		Dialog.init(e);
	}
}

function transferordercancel(obj, type) {
	try {
		var coinname = $(obj).parent().parent().find('td').eq(3).html();
		console.log("coinname is "+coinname);
		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};
			eos.contract(g_coindexcontract, options).then(contract => {
				contract.takeback(account.name, "0.0000 "+coinname, type, options).then(function (tx) {
					Dialog.init('Success!');
					getuserorderlist(type);
					//getaccountinfo(account.name);
				}).catch(function (e) {
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})

	} catch (e) {
		Dialog.init(e);
	}
}

function transferbuy(dialog) {
	try {
		var cointoeos = accMul($("#exchangecountinput").val(), sellerprice);
		if (cointoeos.toFixed(4) != cointoeos) {
			if (cointoeos.toFixed(4) < cointoeos) {
				cointoeos = cointoeos + 0.0001;
			}
		}

		console.log("transferbuy cointoeos is " + cointoeos.toFixed(4));

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosio.token', options).then(contract => {
				contract.transfer(account.name, g_coindexcontract, cointoeos.toFixed(4) + ' EOS', sellersel + " " + g_curexchangetoken, options).then(function (tx) {
					Dialog.init('Success!');
					getaccountinfo(account.name);
					//dialog.dialog( "close" );
				}).catch(function (e) {
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
		
	} catch (e) {
		Dialog.init(e);
	}
}

function wantbuy(obj) {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	g_exchangetype = 0;

	$("#exchangeinfobalance").text("余额: EOS");
	getuserbalance("eosio.token", "EOS");

	$("#exchangecountinput").val('');
	$("#exchangecountinput").attr("placeholder", "请输入想购买的数量");
	$("#exchangeinfoeos").text('交易额:0 EOS');
	sellersel = $(obj).parent().parent().find('td').eq(0).html();
	sellerprice = $(obj).parent().parent().find('td').eq(1).find("p").html().split(' ')[0];

	console.log("seller is " + sellersel + " sellerprice is " + sellerprice);

	$( "#exchangedialogform" ).dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		draggable: false,
		modal:true,
		title: "购买" + g_curexchangetoken + " 价格:"+sellerprice,
		buttons: {
		  "确认": function() {
			var bValid = true;
			if (checkexchangecount() == -1) {
				bValid = false;
			}

			var curusername = $("#usernamea").html().split(' ')[0];
			if(curusername == sellersel)
			{
				Dialog.init("不能自己买自己售卖的币");
				bValid = false;
			}

			if($("#exchangeinfoeos").text().split(":")[1].split(' ')[0]*10000 > $("#exchangeinfobalance").text().split(":")[1].split(' ')[0]*10000)
			{
				Dialog.init("你的余额不足");
				bValid = false;
			}

			if(bValid){
				transferbuy($(this));
			}
		  },
		},
	}).dialog("open");
}

function transfersell(dialog) {
	try {
		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract(g_curexchangecontract, options).then(contract => {
				contract.transfer(account.name, g_coindexcontract, $("#exchangecountinput").val()+".0000 "+g_curexchangetoken, buyersel + " " + g_curexchangetoken, options).then(function (tx) {
					Dialog.init('Success!');
					getuserbalance(g_curexchangecontract, g_curexchangetoken);
					//dialog.dialog( "close" );
					//getaccountinfo(account.name);
				}).catch(function (e) {
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	} catch (e) {
		Dialog.init(e);
	}
}

function wantsell(obj) {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	g_exchangetype = 1;

	$("#exchangeinfobalance").text("余额: " + g_curexchangetoken);
	getuserbalance(g_curexchangecontract, g_curexchangetoken);

	$("#exchangecountinput").val('');
	$("#exchangecountinput").attr("placeholder", "请输入想出售的数量");
	$("#exchangeinfoeos").text('交易额:0.0000 EOS');
	buyersel = $(obj).parent().parent().find('td').eq(0).html();
	buyerprice = $(obj).parent().parent().find('td').eq(1).find("p").html().split(' ')[0];

	console.log("buyer is " + buyersel + " buyerprice is " + buyerprice);

	$( "#exchangedialogform" ).dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		draggable: false,
		modal:true,
		title: "售卖" + g_curexchangetoken +" 价格:"+buyerprice,
		buttons: {
		  "确认": function() {
			var bValid = true;
			if (checkexchangecount() == -1) {
				bValid = false;
			}

			var curusername = $("#usernamea").html().split(' ')[0];
			if(curusername == buyersel)
			{
				Dialog.init("不能自己把币卖给自己");
				bValid = false;
			}

			if($("#exchangecountinput").val()*10000 > $("#exchangeinfobalance").text().split(":")[1].split(' ')[0]*10000)
			{
				Dialog.init("你的"+g_curexchangetoken+"不足");
				bValid = false;
			}

			if(bValid){
				transfersell($(this));
			}
		  },
		},
	}).dialog("open");
}

function checkordercount() {
	var r = /^[0-9]+$/;
	var count = $("#pushordercount").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function showexchangeinfo() {
	var cointoeos = '';
	if(g_exchangetype == 0){
		cointoeos = accMul($("#exchangecountinput").val(), sellerprice);
	}
	else{
		cointoeos = accMul($("#exchangecountinput").val(), buyerprice);
	}
	if (cointoeos.toFixed(4) != cointoeos) {
		if (cointoeos.toFixed(4) < cointoeos) {
			cointoeos = cointoeos + 0.0001;
		}
	}
	$("#exchangeinfoeos").text("交易额:" + cointoeos.toFixed(4) + " EOS");
}

function checkexchangecount() {
	var r = /^[0-9]+$/;
	var count = $("#exchangecountinput").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}

	var cointoeos = accMul($("#exchangecountinput").val(), sellerprice);
	if (cointoeos.toFixed(4) != cointoeos) {
		if (cointoeos.toFixed(4) < cointoeos) {
			cointoeos = cointoeos + 0.0001;
		}
	}

	if (accMul(cointoeos.toFixed(4), 10000) > accMul(g_curliquideos, 10000)) {
		Dialog.init("你的EOS不足");
		return -1;
	}
}

function checkorderprice() {
	// var r = /^[0-9]+$/;
	// var count = $("#pushorderprice").val();
	// if (!r.test(count)) {
	// 	Dialog.init("价格须为整数");
	// 	return -1;
	// }
	var price = $("#pushorderprice").val();
	if (!(/(^[0-9]*[1-9][0-9]*$)/.test(price)) &&
		!(/^\d+(\.\d+)?$/.test(price))) {
		Dialog.init("价格输入格式有错，请输入整数或小数");
		return -1;
	}

	if (price < 0.000001) {
		Dialog.init("价格最小须为0.000001 EOS");
		return -1;
	}


	var g = /^\d+(?:\.\d{1,6})?$/;
	if (!g.test(price)) {
		Dialog.init("只支持六位小数");
		return -1;
	}
}

function accMul(arg1, arg2) {

	var m = 0,
		s1 = arg1.toString(),
		s2 = arg2.toString();

	try {
		m += s1.split(".")[1].length
	} catch (e) {}

	try {
		m += s2.split(".")[1].length
	} catch (e) {}

	return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)

}

function dealadd(obj) {
	var buyername = obj["buyer_account"];
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var dealindex = obj["pkey"];
	var dealtime = obj["buytime"];
	var tritem = $("#deallistbody").find(document.getElementById(dealindex));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		if (sellerassetname == curcoindeal || curcoindeal == 'all') {
			var tdbuyer = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + buyername + "</td>";
			var tdseller = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + sellername + "</td>";
			var tdprice = "<td style='text-align:center;'><p >" + sellerprice + "</p></td>";
			var tdcount = "<td style='text-align:center;'>" + sellerassetaccount + " " + sellerassetname + "</td>";
			var tddealtime = "<td style='text-align:center;'>" + formatDateTime(dealtime / 1000) + "</td>";
			var item = "<tr style='font-size:80%;' id='" + dealindex + "' class='update'>" + tdbuyer + tdseller + tdprice + tdcount + tddealtime + "</tr>";

			$("#deallistbody").prepend(item);
		}
	} else {
		tritem.attr("class", "update");
	}
}

function dealdel() {
	$("#deallistbody").find("tr").filter(".old").remove();

	$("#deallistbody").find("tr").attr("class", "old");
}

function selleradd(obj) {
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var tritem = $("#sellertablebody").find(document.getElementById(sellername + sellerassetname));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		var tdseller = "<td style='word-wrap:break-word;word-break:break-all;'>" + sellername + "</td>";
		var tdprice = "<td><p>" + sellerprice + "</p></td>";
		var tdcount = "<td>" + sellerassetaccount + "</td>";
		var tdcoinname = "<td>" + sellerassetname + "</td>";
		var tdbuy = "<td><button class='btn' onclick='wantbuy(this)'>购买</button></td>";

		var item = "<tr style='font-size:80%;' id='" + sellername + sellerassetname + "' class='update'>" + tdseller + tdprice + tdcount + tdcoinname + tdbuy + "</tr>";
		$("#sellertablebody").append(item);

	} else {
		var tditem = tritem.find('td');
		tditem.eq(0).html(sellername);
		tditem.eq(1).find("p").text(sellerprice);
		tditem.eq(2).html(sellerassetaccount);
		tritem.attr("class", "update");
	}
}

function sellerdel(coinname) {
	$("#sellertablebody").find("tr").filter(".old").remove();
	$("#sellertablebody").find("tr").attr("class", "old");

	if(coinname == g_curexchangetoken){
	if($("#sellertablebody").find("tr").length == 0){
		$("#nosellerinfodiv").show();
	}
	else{
		$("#nosellerinfodiv").hide();
	}
	}
	else{
		$("#nosellerinfodiv").hide();
	}
}

function getsellerlist() {
	if($("#tokenul .active").length == 0)
	{
		return -1;
	}
	
	var pkey = $("#tokenul .active").find('a').attr('id').split(' ')[1];
	var coinname = $("#tokenul .active").find('a').attr('class');

	eosjs.getTableRows(true, g_coindexcontract, pkey, "sellerlist", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				selleradd(data["rows"][i]);
			}

			SortTb($("#sellertablebody"), 1);

			sellerdel(coinname);
		} else {
			console.log(error);
		}
	})
}

function buyeradd(obj) {
	var buyername = obj["buyer_account"];
	var buyerasset = obj["coin"];
	var buyerprice = obj["price"];
	var buyerassetarr = buyerasset.split('.');
	var buyerassetaccount = buyerassetarr[0];
	var buyerassetname = buyerassetarr[1].split(' ')[1];
	var tritem = $("#buyertablebody").find(document.getElementById(buyername + buyerassetname));

	if (buyerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		var tdbuyer = "<td style='word-wrap:break-word;word-break:break-all;'>" + buyername + "</td>";
		var tdprice = "<td><p >" + buyerprice + "</p></td>";
		var tdcount = "<td>" + buyerassetaccount + "</td>";
		var tdcoinname = "<td>" + buyerassetname + "</td>";
		var tdsell = "<td><button class='btn' onclick='wantsell(this)'>出售</button></td>";

		var item = "<tr style='font-size:80%;' id='" + buyername + buyerassetname + "' class='update'>" + tdbuyer + tdprice + tdcount + tdcoinname + tdsell + "</tr>";

		$("#buyertablebody").append(item);

	} else {
		var tditem = tritem.find('td');
		tditem.eq(0).html(buyername);
		tditem.eq(1).find("p").text(buyerprice);
		tditem.eq(2).html(buyerassetaccount);
		tritem.attr("class", "update");
	}
}

function buyerdel(coinname) {
	$("#buyertablebody").find("tr").filter(".old").remove();
	$("#buyertablebody").find("tr").attr("class", "old");

	if(coinname == g_curexchangetoken)
	{
	if($("#buyertablebody").find("tr").length == 0){
		$("#nobuyerinfodiv").show();
	}
	else{
		$("#nobuyerinfodiv").hide();
	}
	}
	else{
		$("#nobuyerinfodiv").hide();
	}
}

function getbuyerlist() {
	if($("#tokenul .active").length == 0)
	{
		return -1;
	}
	
	var pkey = $("#tokenul .active").find('a').attr('id').split(' ')[1];
	var coinname = $("#tokenul .active").find('a').attr('class');

	eosjs.getTableRows(true, g_coindexcontract, pkey, "buyerlist", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				buyeradd(data["rows"][i]);
			}

			SortTb($("#buyertablebody"), 1);

			buyerdel(coinname);
		} else {
			console.log(error);
		}
	})
}

function getdeallist() {
	eosjs.getTableRows(true, g_coindexcontract, g_coindexcontract, "buyrecords", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				dealadd(data["rows"][i]);
			}

			//SortTb(1);

			dealdel();
		} else {
			console.log(error);
		}
	})
}

function coindeallichange(obj) {
	var symbol = $(obj).html();

	if (symbol != curcoindeal) {
		$("#deallistbody").empty();
	}

	if ($(obj).attr('id') != "coindealallid") {
		curcoindeal = symbol;
		if ($("#coindealul").find(document.getElementById('coindealallid')).length == 0) {
			var coindeal = '';
			coindeal = '<li><a id="coindealallid" onclick="javascript:coindeallichange(this)">全部</a></li>';
			$("#coindealul").prepend(coindeal);
		}
	} else {
		curcoindeal = 'all';
		$(obj).parent().remove();
	}

	$("#coindealtype").html(symbol + '<b class="caret"></b>');
}

function exchangecoinliclick(obj)
{
	$("#nosellerinfodiv").hide();
	$("#nobuyerinfodiv").hide();
	g_curexchangecontract = $(obj).find('i').html();
	g_curexchangetoken = $(obj).find('a').html().split(' ')[0];
	console.log("curcontract is " + g_curexchangecontract);
	console.log("curtoken is " + g_curexchangetoken);

	getsellerlist();
	getbuyerlist();
}

function coinadd(obj) {
	var pkey = obj["pkey"];
	var contract = obj["contract"];
	var symbol = obj["quant"].split(' ')[1];
	var enable = obj["enable"];

	if (enable == 0) {
		return 0;
	}

	var coinli = '';
	coinli = //'<li class="divider"></li>' +
		'<li onclick="exchangecoinliclick(this)"><a href="#exchangediv" data-toggle="tab" id="coin ' +
		pkey + '" class="' + symbol + '">' + symbol + ' <i>' + contract + '</i></a></li>';
	$("#tokenul").append(coinli);

	var coindeal = '';
	coindeal = '<li><a onclick="javascript:coindeallichange(this)">' + symbol + '</a></li>';
	$("#coindealul").append(coindeal);
}

function getcoinlist() {
	if(getcoinsflagex == 1)
	{
		return;
	}

	getcoinsflagex = 1;

	if (getcoinsflag == 0) {
		eosjs.getTableRows(true, g_coindexcontract, g_coindexcontract, "coins", "", 0, -1, 10000, function (error, data) {
			if (error == null) {
				getcoinsflagex = 0;
				getcoinsflag = 1;
				var cnt = data["rows"].length;
				for (var i = 0; i < cnt; i++) {
					coinadd(data["rows"][i]);
				}

				if(i == cnt)
				{
					if ($("#example-navbar-collapse").find(".active").length == 0) {
						$(".BT").click();
					}
				}
			} else {
				getcoinsflagex = 0;
				console.log(error);
			}
		})
	}
}

function getglobaldata() {
	eosjs.getTableRows(true, g_coindexcontract, g_coindexcontract, "global", "", 0, -1, 10, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				$("#totaldealasset").text("总成交额: " + data["rows"][i]["dealtotalasset"]);
			}
		} else {
			console.log(error);
		}
	})
}

function scatterloginout() {
	if (tp.isConnected() == true) {
		$("#logindiv").show();
		$("#userinfoul").hide();

		loginflag = 0;

		$("sellli").remove();

		$(".nav-tabs").find(document.getElementById('sellli')).remove();

		checkshishicai('');
	}
	else{
		if (!scatter) {
			Dialog.init("Please install Scatter!");
			return;
		}

		scatter.forgetIdentity().then(function () {
			$("#logindiv").show();
			$("#userinfoul").hide();

			loginflag = 0;

			$("sellli").remove();

			$(".nav-tabs").find(document.getElementById('sellli')).remove();

			checkshishicai('');
		});
	}
}

function scatterLogin() {
	if (tp.isConnected() == true) {
		tp.getCurrentWallet().then(data => {
			curtpwallet = data["data"]["name"];
			loginflag = 1;
			$("#logindiv").hide();
			$("#userinfoul").show();
			$("#usernamea").html(curtpwallet + ' <b class="caret"></b>').css('color', '#1E90FF');
			checkshishicai(curtpwallet);
			getaccountinfo(curtpwallet);
		})
	} else {
		if (!scatter) {
			Dialog.init("Please install Scatter!");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			loginflag = 1;
			console.log(account.name + " 已登录");

			$("#logindiv").hide();
			$("#userinfoul").show();
			$("#usernamea").html(account.name + ' <b class="caret"></b>').css('color', '#1E90FF');
			checkshishicai(account.name);
			getaccountinfo(account.name);
		}).catch(function (e) {
			console.log(e);
		});
	}
}

function getuserorderlist(type) {
	var ordertable = '';
	var tablename = '';
	var accountkey = '';
	if(type == 0)
	{
		ordertable = $("#usersellordertablebody");
		tablename = "sellerlist";
		accountkey = "seller_account";
	}
	else if(type == 1)
	{
		ordertable = $("#userbuyordertablebody");
		tablename = "buyerlist";
		accountkey = "buyer_account";
	}
	ordertable.empty();
	var curusername = $("#usernamea").html().split(' ')[0];
	eosjs.getTableRows(true, g_coindexcontract, g_coindexcontract, "coins", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				var pkey = data["rows"][i]["pkey"];
				eosjs.getTableRows(true, g_coindexcontract, pkey, tablename, "", 0, -1, 10000, function (error, orderdata) {
					if (error == null) {
						var cnt = orderdata["rows"].length;
						for (var i = 0; i < cnt; i++) {
							var obj = orderdata["rows"][i];
							if (obj[accountkey] == curusername) {
								var name = curusername;
								var asset = obj["coin"];
								var price = obj["price"];
								var assetarr = asset.split('.');
								var assetaccount = assetarr[0];
								var assetname = assetarr[1].split(' ')[1];

								var tdaccount = "<td style='word-wrap:break-word;word-break:break-all;'>" + name + "</td>";
								var tdprice = "<td><p >" + price + "</p></td>";
								var tdcount = "<td>" + assetaccount + "</td>";
								var tdcoinname = "<td>" + assetname + "</td>";

								var tdbutton = '';
								if(type == 0){
									tdbutton = "<td><button class='btn' onclick='transferordercancel(this, 0)'>撤单</button></td>";
								}
								else if(type == 1){
									tdbutton = "<td><button class='btn' onclick='transferordercancel(this, 1)'>撤单</button></td>";
								}

								var item = "<tr style='font-size:80%;' id='" + name + assetname + "' class='update'>" + tdaccount + tdprice + tdcount + tdcoinname + tdbutton + "</tr>";

								ordertable.append(item);
							}
						}
					} else {
						console.log(error);
					}
				})
			}
		} else {
			console.log(error);
		}
	})

}

function exchangeDialogInit()
{
	$( "#exchangedialogform" ).dialog({
		autoOpen: false,
	});
}

function pushOrderDialogInit()
{
	$( "#pushorderform" ).dialog({
		autoOpen: false
	});
}

function calcorderamount()
{
	if(g_ordertype == 0)
	{
		$("#pushorderamount").text("交易额:" + $("#pushordercount").val() + " "+g_curexchangetoken);
	}
	else if(g_ordertype == 1)
	{
		var cointoeos = accMul($("#pushordercount").val(), $("#pushorderprice").val());
		if (cointoeos.toFixed(4) != cointoeos) {
			if (cointoeos.toFixed(4) < cointoeos) {
				cointoeos = cointoeos + 0.0001;
			}
		}
		$("#pushorderamount").text("交易额:" + cointoeos.toFixed(4) + " EOS");
	}
}

function pushsellorder()
{
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	g_ordertype = 0;

	$("#pushorderamount").text("交易额:"+g_curexchangetoken);
	$("#pushordercount").attr("placeholder", "请输入想出售的数量");
	$("#pushordercount").val('');
	$("#pushorderprice").attr("placeholder", "请输入出售单价，最小0.000001EOS");
	$("#pushorderprice").val('');


	getuserbalance(g_curexchangecontract, g_curexchangetoken);
	$("#pushorderform").dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		draggable: false,
		title: "我要卖"+g_curexchangetoken,
		modal:true,
		buttons: {
		  "确认": function() {
			console.log("push sell order dialog enter!");
			var bValid = true;
			if (checkordercount() == -1) {
				bValid = false;
			}
		
			if (checkorderprice() == -1) {
				bValid = false;
			}

			if($("#pushordercount").val()*10000 > $("#pushorderbalance").text().split(':')[1].split(' ')[0]*10000)
			{
				Dialog.init("你的"+g_curexchangetoken+"不足");
				bValid = false;
			}

			if(bValid)
			{
				transfersellorder($(this));
			}
		  },
		},
		close: function() {
			console.log("push order dialog exit!");
		}
	}).dialog("open");
}

function pushbuyorder()
{
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	g_ordertype = 1;
	$("#pushorderamount").text("交易额:EOS");
	$("#pushordercount").attr("placeholder", "请输入想购买的数量");
	$("#pushordercount").val('');
	$("#pushorderprice").attr("placeholder", "请输入购买单价，最小0.000001EOS");
	$("#pushorderprice").val('');

	getuserbalance("eosio.token", "EOS");
	$("#pushorderform").dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		draggable: false,
		title: "我要买"+g_curexchangetoken,
		modal:true,
		buttons: {
		  "确认": function() {
			console.log("push buy order dialog enter!");

			var bValid = true;
			if (checkordercount() == -1) {
				bValid = false;
			}
		
			if (checkorderprice() == -1) {
				bValid = false;
			}

			if($("#pushorderamount").text().split(':')[1].split(' ')[0]*10000 > $("#pushorderbalance").text().split(':')[1].split(' ')[0]*10000)
			{
				Dialog.init("你的EOS不足");
				bValid = false;
			}

			if(bValid)
			{
				transferbuyorder($(this));
			}		  
		  },
		},
		close: function() {
			console.log("push order dialog exit!");
		}
	}).dialog("open");
}

$(function () {
	exchangeDialogInit();
	pushOrderDialogInit();
	$("#mainul").click(function () {
		$("#userinfoul").find('li').removeClass("active");
	})

	$("#userinfoul").click(function () {
		$("#mainul").find('li').removeClass("active");
	})

	EosjsInit();
	document.addEventListener('scatterLoaded', function (scatterExtension) {
		console.log("scatterLoaded enter");
		scatter = window.scatter;
		eos = scatter.eos(network, Eos, {}, "http");
	});

	setInterval(getcoinlist, 2000);
	setInterval(getsellerlist, 2000);
	setInterval(getbuyerlist, 2000);
	setInterval(getdeallist, 2000);
	setInterval(getglobaldata, 3000);

	gettpwalletlist();
})

function checkshishicai(name) {
	// $("#lushishicaibtn").html("GET 0.1 EOS");
	// $("#lushishicaibtn").removeAttr('disabled');
	$("#luwizboxbtn").html("GET 2 WIZBOX");
	$("#luwizboxbtn").removeAttr('disabled');
	$("#luteabtn").html("GET 200 TEA");
	$("#luteabtn").removeAttr('disabled');
	$("#lucubebtn").html("GET 1000 CUBE");
	$("#lucubebtn").removeAttr('disabled');
	$("#luenbbtn").html("GET 1000 ENB 价值0.2EOS");
	$("#luenbbtn").removeAttr('disabled');

	eosjs.getTableRows(true, "linzongsheng", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#luteabtn").html("此账号已撸200TEA");
				$("#luteabtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	eosjs.getTableRows(true, "eoscubetoken", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#lucubebtn").html("此账号已撸1000CUBE");
				$("#lucubebtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	eosjs.getTableRows(true, "eosenbpocket", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#luenbbtn").html("此账号已撸1000ENB");
				$("#luenbbtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	var checkurl = 'https://adb.wizards.one/' + name;
	$.ajax({
		type: 'get',
		mode: "no-cors",
		datatype: 'text',
		url: checkurl,
		success: function (data) {
			if (data["claimed"] == true) {
				$("#luwizboxbtn").html("此账号已撸 WIZBOX");
				$("#luwizboxbtn").attr("disabled", true);
			} else {
				$("#luwizboxbtn").html("GET " + data["quantity"] + " WIZBOX");
				$("#luwizboxbtn").removeAttr('disabled');
			}
		},
	});
}

function luwizbox() {
	if (tp.isConnected() == true) {
		var query = 'account=' + g_curtpwallet;

		var claimurl = 'https://adb.wizards.one/claim';
		$.ajax({
			type: 'post',
			data: query,
			mode: "no-cors",
			datatype: 'text',
			url: claimurl,
			success: function (data) {
				// console.log(data);
				// Dialog.init('Success!');
			},
		});
		var curaccount = g_curtpwallet;
		var contract = "eosio.msig";
		var action = "approve";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "proposer";
		paramval = "wizboxsender";
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "proposal_name";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "level";
		paramval = {
			actor: curaccount,
			permission: "active"
		};
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"proposer":"wizboxsender", "proposal_name":"' + curaccount + '", "level":{"actor":"' + curaccount + '","permission":"active"}}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
			var execurl = 'https://adb.wizards.one/exec';
			$.ajax({
				type: 'post',
				data: query,
				mode: "no-cors",
				datatype: 'text',
				url: execurl,
				success: function (data) {
					checkshishicai(curaccount);
				},
			});


		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			var query = 'account=' + account.name;

			var claimurl = 'https://adb.wizards.one/claim';
			$.ajax({
				type: 'post',
				data: query,
				mode: "no-cors",
				datatype: 'text',
				url: claimurl,
				success: function (data) {
					// console.log(data);
					// Dialog.init('Success!');
				},
			});

			eos.contract('eosio.msig', options).then(contract => {
				var level = {
					"actor": account.name,
					"permission": "active"
				};
				contract.approve("wizboxsender", account.name, level, options).then(function (tx) {
					Dialog.init('Success!');

					var execurl = 'https://adb.wizards.one/exec';
					$.ajax({
						type: 'post',
						data: query,
						mode: "no-cors",
						datatype: 'text',
						url: execurl,
						success: function (data) {
							checkshishicai(account.name);
							// console.log(data);
							// Dialog.init('Success!');
						},
					});

					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})
	}
}

function lutea() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "linzongsheng";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "200.0000 TEA";
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "ram_payer";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"200.0000 TEA", "ram_payer":"' + curaccount + '"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('linzongsheng', options).then(contract => {
				contract.signup(account.name, "0.0000 TEA", account.name, options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function luenb() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "eosenbpocket";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "0.0000 ENB";
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "ram_payer";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"1000.0001 ENB", "ram_payer":"' + curaccount + '"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosenbpocket', options).then(contract => {
				contract.signup(account.name, "1000.0001 ENB", account.name, options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function lucube() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "eoscubetoken";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "1000.0000 CUBE";
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"0.0000 CUBE"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eoscubetoken', options).then(contract => {
				contract.signup(account.name, "0.0000 CUBE", options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function lushishicai() {
	Dialog.init("已暂停");
	return;
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		tp.eosTokenTransfer({
			from: curaccount,
			to: 'eosplaybrand',
			amount: '0.3000',
			tokenName: 'EOS',
			precision: 4,
			contract: 'eosio.token',
			memo: "dice:o2@wayunggogogo",
		}).then(function (data) {
			//Dialog.init('Success!');
			checkshishicai(curaccount);
		}).catch(function (e) {
			Dialog.init('Tx failed: ' + e.error.details[0].message);
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosio.token', options).then(contract => {
				contract.transfer(account.name, "eosplaybrand", "0.3000 EOS", "dice:o2@wayunggogogo", options).then(function (tx) {
					Dialog.init('Success!');
					checkshishicai(account.name);
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					Dialog.init('Tx failed: ' + e.error.details[0].message);
				});
			});

		})
	}
}

// function gohomefroma(obj) {
// 	var cointype = $(obj).html().split(' ')[0];
// 	$("#exchangelistid").show();
// 	$("#exchangedialogform").hide();
// 	$("#exchangecountinput").attr("placeholder", "请输入想购买的" + cointype + "数量");
// }